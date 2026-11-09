'use server';

import { getLoggedInUser } from '@/lib/appwrite/session';
import {
  getEstablishmentByUserId,
  saveStoreDataStep,
  saveOperationStep,
  saveSubaccountAndActivate,
  updateSubscriptionStatus,
} from '@/lib/appwrite/establishments';
import {
  storeDataSchema,
  operationSchema,
  subaccountSchema,
} from '@/lib/schemas/onboarding';
import {
  createAsaasCustomer,
  createOrGetAsaasCustomer,
} from '@/lib/asaas/customers';
import {
  createAsaasSubscription,
  getAsaasSubscriptionPix,
  getAsaasSubscriptionPayments,
} from '@/lib/asaas/subscriptions';
import { createAsaasSubaccount } from '@/lib/asaas/subaccounts';
import { generateKycKey, uploadKycDocument } from '@/lib/r2/storage';
import { ensureEstablishmentTables } from '@/lib/appwrite/tables';
import { encryptSecret, isEncryptedSecret } from '@/lib/security/encryption';

export interface ActionResponse {
  success?: boolean;
  message?: string;
  nextStep?: string;
  errors?: Record<string, string[]>;
}

// -----------------------------------------------------------------------------
// Passo 1: Dados da Loja
// -----------------------------------------------------------------------------
export async function submitStoreDataAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { message: 'Sessão expirada. Faça login novamente.' };
    }

    const raw = {
      name: formData.get('name'),
      legalName: formData.get('legalName'),
      cnpj: formData.get('cnpj'),
      category: formData.get('category'),
      phone: formData.get('phone'),
      postalCode: formData.get('postalCode'),
      address: formData.get('address'),
    };

    const parsed = storeDataSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    await saveStoreDataStep(user.$id, parsed.data);

    return {
      success: true,
      nextStep: '/onboarding/operacao',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Onboarding] Erro no Passo 1:', msg);
    return { message: msg || 'Erro ao salvar dados da loja. Tente novamente.' };
  }
}

// -----------------------------------------------------------------------------
// Passo 2: Operação & Mesas
// -----------------------------------------------------------------------------
export async function submitOperationAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { message: 'Estabelecimento não encontrado. Inicie pelo Passo 1.' };
    }

    const daysRaw = formData.get('openingDays');
    let openingDays: string[] = [];
    if (typeof daysRaw === 'string') {
      try {
        openingDays = JSON.parse(daysRaw);
      } catch {
        openingDays = daysRaw.split(',').map((d) => d.trim()).filter(Boolean);
      }
    }

    const raw = {
      tablesCount: formData.get('tablesCount'),
      orderMode: formData.get('orderMode'),
      openingDays,
      openingTime: formData.get('openingTime'),
      closingTime: formData.get('closingTime'),
    };

    const parsed = operationSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    await saveOperationStep(establishment.$id, parsed.data);

    return {
      success: true,
      nextStep: '/onboarding/subconta',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Onboarding] Erro no Passo 2:', msg);
    return { message: msg || 'Erro ao salvar operação. Tente novamente.' };
  }
}

// -----------------------------------------------------------------------------
// Passo 3: Subconta Bancária, Uploads KYC no R2 & Asaas
// -----------------------------------------------------------------------------
export async function submitSubaccountAction(
  _prev: ActionResponse,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      return { message: 'Sessão expirada. Faça login novamente.' };
    }

    const establishment = await getEstablishmentByUserId(user.$id);
    if (!establishment) {
      return { message: 'Estabelecimento não encontrado.' };
    }

    // 1. Processar arquivos KYC opcionais se enviados
    let docIdKey: string | undefined;
    let docCnpjKey: string | undefined;

    const docIdFile = formData.get('docId') as File | null;
    const docCnpjFile = formData.get('docCnpj') as File | null;

    if (docIdFile && docIdFile instanceof File && docIdFile.size > 0 && docIdFile.name) {
      if (docIdFile.size > 10 * 1024 * 1024) {
        return { errors: { docId: ['Arquivo excede o limite de 10 MB'] } };
      }
      docIdKey = generateKycKey(establishment.$id, 'cnh', docIdFile.name);
      const docIdBuffer = Buffer.from(await docIdFile.arrayBuffer());
      await uploadKycDocument(docIdKey, docIdBuffer, docIdFile.type || 'application/pdf');
    }

    if (docCnpjFile && docCnpjFile instanceof File && docCnpjFile.size > 0 && docCnpjFile.name) {
      if (docCnpjFile.size > 10 * 1024 * 1024) {
        return { errors: { docCnpj: ['Arquivo excede o limite de 10 MB'] } };
      }
      docCnpjKey = generateKycKey(establishment.$id, 'cnpj', docCnpjFile.name);
      const docCnpjBuffer = Buffer.from(await docCnpjFile.arrayBuffer());
      await uploadKycDocument(docCnpjKey, docCnpjBuffer, docCnpjFile.type || 'application/pdf');
    }

    // 2. Validação dos dados cadastrais com o schema
    const raw = {
      repName: formData.get('repName'),
      repCpf: formData.get('repCpf'),
      repBirthDate: formData.get('repBirthDate'),
      bankCode: formData.get('bankCode'),
      bankPixKey: formData.get('bankPixKey'),
      bankAgency: formData.get('bankAgency'),
      bankAccount: formData.get('bankAccount'),
      docIdKey,
      docCnpjKey,
    };

    const parsed = subaccountSchema.safeParse(raw);
    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    // 3. Integração com Asaas (Customer + Subscription + Subaccount)
    const emailToUse = user.email || 'contato@bempedi.app';
    const cnpjToUse = establishment.cnpj || '';

    // 3a. Cria ou recupera cliente no Asaas para cobrança da assinatura Bempedi
    let customerId = establishment.asaasCustomerId;
    if (!customerId) {
      const customer = await createOrGetAsaasCustomer({
        name: establishment.legalName || establishment.name,
        cpfCnpj: cnpjToUse,
        email: emailToUse,
        phone: establishment.phone,
        postalCode: establishment.postalCode,
        address: establishment.address,
      });
      customerId = customer.id;
    }

    // 3b. Cria ou recupera a assinatura mensal do SaaS
    let subscriptionId = establishment.asaasSubscriptionId;
    if (!subscriptionId) {
      const subscription = await createAsaasSubscription({
        customerId,
        value: 149.0,
        description: 'Mensalidade Bempedi - Sistema de Comandas Digitais',
      });
      subscriptionId = subscription.id;
    }

    // 3c. Cria ou recupera a subconta do estabelecimento para recebimento das comandas
    let subaccountId = establishment.asaasSubaccountId;
    let walletId = establishment.asaasWalletId;
    let subaccountApiKey = establishment.asaasSubaccountApiKey;

    if (!subaccountId) {
      const subaccount = await createAsaasSubaccount({
        name: establishment.legalName || establishment.name,
        email: emailToUse,
        cpfCnpj: cnpjToUse,
        companyType: 'LIMITED',
        phone: establishment.phone,
        postalCode: establishment.postalCode,
        address: establishment.address,
      });
      subaccountId = subaccount.id;
      walletId = subaccount.walletId;
      subaccountApiKey = subaccount.apiKey ? encryptSecret(subaccount.apiKey) : '';
    } else if (subaccountApiKey && !isEncryptedSecret(subaccountApiKey)) {
      // Migra chave legada em texto claro para cifrado
      subaccountApiKey = encryptSecret(subaccountApiKey);
    }

    // 4. Salva no Appwrite ativando o onboarding com 7 dias de período de teste gratuito (Free Trial)
    const now = Date.now();
    const trialStartDate = new Date(now).toISOString();
    const trialEndsAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

    await saveSubaccountAndActivate(establishment.$id, {
      subaccount: parsed.data,
      asaas: {
        customerId,
        subscriptionId,
        subaccountId,
        walletId: walletId || '',
        subaccountApiKey: subaccountApiKey || '',
      },
      subscriptionStatus: 'trialing',
      trialStartDate,
      trialEndsAt,
    });

    // 5. Provisiona antecipadamente as mesas com seus tokens de QR Code
    if (establishment.tablesCount) {
      try {
        await ensureEstablishmentTables(establishment.$id, establishment.tablesCount);
      } catch (tableErr) {
        console.warn('[Onboarding] Aviso: falha ao pré-provisionar mesas:', tableErr);
      }
    }

    return {
      success: true,
      nextStep: '/onboarding/conclusao',
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Onboarding] Erro no Passo 3:', msg);
    return {
      message: msg || 'Erro ao processar subconta e documentação. Tente novamente.',
    };
  }
}

// -----------------------------------------------------------------------------
// Checagem de status da assinatura (utilizada na tela de conclusão)
// -----------------------------------------------------------------------------
export async function checkSubscriptionStatusAction(): Promise<string> {
  const user = await getLoggedInUser();
  if (!user) return 'unauthenticated';

  const est = await getEstablishmentByUserId(user.$id);
  if (!est) return 'not_found';

  // Se já está ativo no banco, retorna imediatamente
  if (est.subscriptionStatus === 'active') {
    return 'active';
  }

  // Conciliação ativa com o Asaas caso o webhook ainda não tenha chegado ou em dev local
  if (est.asaasSubscriptionId) {
    try {
      const payments = await getAsaasSubscriptionPayments(est.asaasSubscriptionId);
      const isPaid = payments.some(
        (p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED',
      );

      if (isPaid) {
        await updateSubscriptionStatus(est.asaasSubscriptionId, 'active');
        return 'active';
      }
    } catch (err) {
      console.warn('[checkSubscriptionStatusAction] Erro na conciliação com Asaas:', err);
    }
  }

  return est.subscriptionStatus || 'pending';
}

export async function getSubscriptionPixAction(): Promise<{
  encodedImage: string;
  payload: string;
} | null> {
  const user = await getLoggedInUser();
  if (!user) return null;

  const est = await getEstablishmentByUserId(user.$id);
  if (!est || !est.asaasSubscriptionId) return null;

  try {
    const pixData = await getAsaasSubscriptionPix(est.asaasSubscriptionId);
    return {
      encodedImage: pixData.encodedImage,
      payload: pixData.payload,
    };
  } catch {
    return null;
  }
}
