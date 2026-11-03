'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  PARTICIPANT_COOKIE_NAME,
  generateParticipantToken,
  verifyParticipantToken,
  type ParticipantSessionPayload,
} from '@/lib/security/client-session';
import { isValidTableToken } from '@/lib/security/table-token';
import {
  isWithinIndoorRadius,
  type Coordinates,
} from '@/lib/security/geofence';
import {
  getTableByToken,
  getTableById,
  createServiceCall,
  type TableDocument,
  type ServiceCallDocument,
} from '@/lib/appwrite/tables';
import {
  joinTableSession,
  settleParticipantPayment,
  getTableSession,
  parseSessionParticipants,
  type TableSessionDocument,
} from '@/lib/appwrite/client-sessions';
import {
  createOrder,
  listParticipantOrders,
  type OrderDocument,
} from '@/lib/appwrite/orders';
import { createAdminClient } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import {
  createPixPaymentOnSubaccount,
  checkSubaccountPaymentStatus,
  type CreatePixPaymentResult,
} from '@/lib/asaas/pix';
import { isValidCpf } from '@/lib/validators/cpf';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface CartItemInput {
  productId: string;
  productName: string;
  unitPrice: number; // centavos
  quantity: number;
  notes?: string;
  selectedOptions?: string | Record<string, unknown> | Array<unknown>;
}

const cartItemInputSchema = z.object({
  productId: z.string().trim().min(1, 'ID do produto é obrigatório'),
  productName: z.string().trim().min(1, 'Nome do produto é obrigatório'),
  unitPrice: z.number().int().nonnegative('Preço unitário deve ser maior ou igual a zero'),
  quantity: z.number().int().positive('Quantidade deve ser pelo menos 1'),
  notes: z.string().max(500, 'Observação não pode exceder 500 caracteres').optional(),
  selectedOptions: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]).optional(),
});

/**
 * Busca o estabelecimento pelo ID.
 */
async function getEstablishmentById(
  establishmentId: string,
): Promise<EstablishmentDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.establishments,
      establishmentId,
    );
    return JSON.parse(JSON.stringify(doc)) as EstablishmentDocument;
  } catch {
    return null;
  }
}

/**
 * Verifica se o acesso está dentro do raio geográfico permitido (250m indoor).
 */
function checkLocationAccess(
  clientCoords: Coordinates | null | undefined,
  establishment: EstablishmentDocument,
): { allowed: boolean; message?: string } {
  const hasEstCoords =
    typeof establishment.latitude === 'number' &&
    typeof establishment.longitude === 'number' &&
    !Number.isNaN(establishment.latitude) &&
    !Number.isNaN(establishment.longitude);

  // Se o estabelecimento não tiver coordenadas cadastradas
  if (!hasEstCoords) {
    if (process.env.NODE_ENV === 'development') {
      return { allowed: true };
    }
    // Em produção, se não configurado, permite ou requer
    return { allowed: true };
  }

  // Estabelecimento possui coordenadas: obrigatoriamente valida cliente
  if (!clientCoords) {
    return {
      allowed: false,
      message: 'Permissão de localização necessária para validar acesso à mesa (limite de 250m).',
    };
  }

  const estCoords: Coordinates = {
    latitude: establishment.latitude!,
    longitude: establishment.longitude!,
  };

  const isInside = isWithinIndoorRadius(clientCoords, estCoords, 250);
  if (!isInside) {
    return {
      allowed: false,
      message: 'Você precisa estar no estabelecimento para acessar a comanda (limite de 250m).',
    };
  }

  return { allowed: true };
}

/**
 * Valida o token da mesa e a geolocalização indoor do cliente.
 */
export async function validateClientLocation(
  token: string,
  clientCoords?: Coordinates | null,
): Promise<
  ActionResult<{
    tableId: string;
    tableNumber: number;
    establishmentId: string;
    establishmentName?: string;
  }>
> {
  try {
    if (!token || !isValidTableToken(token)) {
      return { success: false, message: 'QR Code ou token de mesa inválido.' };
    }

    const table = await getTableByToken(token);
    if (!table || !table.isActive) {
      return { success: false, message: 'Mesa não encontrada ou inativa.' };
    }

    const establishment = await getEstablishmentById(table.establishmentId);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const locationCheck = checkLocationAccess(clientCoords, establishment);
    if (!locationCheck.allowed) {
      return { success: false, message: locationCheck.message };
    }

    return {
      success: true,
      message: 'Localização validada com sucesso.',
      data: {
        tableId: table.$id,
        tableNumber: table.number,
        establishmentId: table.establishmentId,
        establishmentName: establishment.name,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[validateClientLocation] Erro:', msg);
    return { success: false, message: 'Erro ao validar localização da mesa.' };
  }
}

/**
 * Adiciona o participante à sessão da mesa (ou cria uma nova) e grava o cookie HttpOnly de sessão.
 */
export async function joinTable(
  token: string,
  nickname: string,
  clientCoords?: Coordinates | null,
): Promise<
  ActionResult<{
    session: TableSessionDocument;
    participantId: string;
    participantName: string;
    tableNumber: number;
    token: string;
  }>
> {
  try {
    const trimmed = nickname?.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      return {
        success: false,
        message: 'Informe um apelido entre 2 e 50 caracteres para entrar na mesa.',
      };
    }

    if (!token || !isValidTableToken(token)) {
      return { success: false, message: 'QR Code ou token de mesa inválido.' };
    }

    const table = await getTableByToken(token);
    if (!table || !table.isActive) {
      return { success: false, message: 'Mesa não encontrada ou inativa.' };
    }

    const establishment = await getEstablishmentById(table.establishmentId);
    if (!establishment) {
      return { success: false, message: 'Estabelecimento não encontrado.' };
    }

    const locationCheck = checkLocationAccess(clientCoords, establishment);
    if (!locationCheck.allowed) {
      return { success: false, message: locationCheck.message };
    }

    const { session, participantId, participantName } = await joinTableSession(
      table.establishmentId,
      table.$id,
      table.number,
      trimmed,
    );

    const sessionToken = await generateParticipantToken({
      participantId,
      participantName,
      sessionId: session.$id,
      tableId: table.$id,
      establishmentId: table.establishmentId,
    });

    const cookieStore = await cookies();
    cookieStore.set(PARTICIPANT_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 horas
    });

    return {
      success: true,
      message: `Bem-vindo(a), ${participantName}!`,
      data: {
        session,
        participantId,
        participantName,
        tableNumber: table.number,
        token: sessionToken,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[joinTable] Erro ao entrar na mesa:', msg);
    return { success: false, message: 'Erro ao ingressar na comanda da mesa.' };
  }
}

/**
 * Autentica o participante a partir do cookie HttpOnly de sessão.
 */
async function authenticateParticipant(): Promise<ParticipantSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PARTICIPANT_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await verifyParticipantToken(token);
  } catch {
    return null;
  }
}

/**
 * Envia itens do carrinho para a cozinha registrando os pedidos na coleção dedicada `orders`.
 */
export async function submitOrderAction(
  items: CartItemInput[],
): Promise<ActionResult<{ orders: OrderDocument[] }>> {
  try {
    const session = await authenticateParticipant();
    if (!session) {
      return {
        success: false,
        message: 'Sessão inválida ou expirada. Escaneie o QR Code da mesa novamente.',
      };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: 'Nenhum item informado para o pedido.' };
    }

    const parsed = z.array(cartItemInputSchema).safeParse(items);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Itens do pedido inválidos.',
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const table = await getTableById(session.tableId);
    const tableNumber = table ? table.number : 1;

    const createdOrders: OrderDocument[] = [];
    for (const item of parsed.data) {
      const order = await createOrder({
        establishmentId: session.establishmentId,
        tableId: session.tableId,
        tableNumber,
        sessionId: session.sessionId,
        participantId: session.participantId,
        participantName: session.participantName,
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        notes: item.notes,
        selectedOptions: item.selectedOptions,
      });
      createdOrders.push(order);
    }

    return {
      success: true,
      message: 'Pedido enviado com sucesso para a cozinha!',
      data: { orders: createdOrders },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[submitOrderAction] Erro ao enviar pedido:', msg);
    return { success: false, message: 'Erro ao enviar pedido para a cozinha.' };
  }
}

/**
 * Cria uma solicitação de serviço (garçom ou maquininha de cartão).
 */
export async function callWaiterAction(
  reason: string,
  type: 'waiter' | 'bill_card' = 'waiter',
): Promise<ActionResult<ServiceCallDocument>> {
  try {
    const session = await authenticateParticipant();
    if (!session) {
      return {
        success: false,
        message: 'Sessão inválida ou expirada. Escaneie o QR Code novamente.',
      };
    }

    const table = await getTableById(session.tableId);
    const tableNumber = table ? table.number : 1;

    const serviceCall = await createServiceCall({
      establishmentId: session.establishmentId,
      tableId: session.tableId,
      tableNumber,
      sessionId: session.sessionId,
      type,
      description: reason || (type === 'bill_card' ? 'Solicitou maquininha de cartão' : 'Chamou garçom'),
      requestedBy: session.participantName,
    });

    return {
      success: true,
      message:
        type === 'bill_card'
          ? 'Solicitação de maquininha enviada ao garçom.'
          : 'Garçom chamado com sucesso.',
      data: serviceCall,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[callWaiterAction] Erro:', msg);
    return { success: false, message: 'Erro ao chamar serviço da mesa.' };
  }
}

/**
 * Emite cobrança PIX dinâmico no Asaas para pagamento da comanda.
 */
export async function requestPixCheckoutAction(
  mode: 'my_items' | 'split' | 'total',
  payerCpf: string,
): Promise<
  ActionResult<{
    paymentId: string;
    pixQrCodeBase64: string;
    pixCopyPaste: string;
    expirationDate: string;
    amountCents: number;
    value: number;
    mode: string;
  }>
> {
  try {
    if (!isValidCpf(payerCpf)) {
      return {
        success: false,
        message: 'CPF inválido. Digite um CPF válido para emissão do PIX.',
      };
    }

    if (!['my_items', 'split', 'total'].includes(mode)) {
      return { success: false, message: 'Modalidade de pagamento inválida.' };
    }

    const session = await authenticateParticipant();
    if (!session) {
      return {
        success: false,
        message: 'Sessão inválida ou expirada. Escaneie o QR Code novamente.',
      };
    }

    const table = await getTableById(session.tableId);
    const tableNumber = table ? table.number : 1;

    const establishment = await getEstablishmentById(session.establishmentId);
    if (!establishment || !establishment.asaasSubaccountApiKey) {
      return {
        success: false,
        message: 'Estabelecimento ainda não configurou a subconta para recebimento PIX.',
      };
    }

    const sessionDoc = await getTableSession(session.sessionId);
    if (!sessionDoc || sessionDoc.status !== 'open') {
      return {
        success: false,
        message: 'Comanda da mesa não encontrada ou já encerrada.',
      };
    }

    const totalAmount = sessionDoc.totalAmount || 0;
    const paidAmount = sessionDoc.paidAmount || 0;
    const remainingTableBalance = Math.max(0, totalAmount - paidAmount);

    if (remainingTableBalance <= 0) {
      return {
        success: false,
        message: 'A comanda da mesa já foi quitada integralmente.',
      };
    }

    let amountToPayCents = 0;

    if (mode === 'my_items') {
      const orders = await listParticipantOrders(session.sessionId, session.participantId);
      const activeOrders = orders.filter((o) => o.status !== 'cancelled');
      const myOrdersTotal = activeOrders.reduce(
        (sum, o) => sum + (o.totalPrice || o.unitPrice * o.quantity),
        0,
      );

      const participants = parseSessionParticipants(sessionDoc.participants);
      const participant = participants.find((p) => p.id === session.participantId);
      const alreadyPaid = participant?.paidAmount || 0;
      const myRemaining = Math.max(0, myOrdersTotal - alreadyPaid);

      if (myRemaining <= 0) {
        return {
          success: false,
          message: 'Seus itens já foram pagos.',
        };
      }

      amountToPayCents = Math.min(myRemaining, remainingTableBalance);
    } else if (mode === 'split') {
      const participants = parseSessionParticipants(sessionDoc.participants);
      const unpaidCount = participants.filter((p) => !p.isPaid).length || 1;
      amountToPayCents = Math.min(
        Math.ceil(remainingTableBalance / unpaidCount),
        remainingTableBalance,
      );
    } else {
      // mode === 'total'
      amountToPayCents = remainingTableBalance;
    }

    if (amountToPayCents <= 0) {
      return {
        success: false,
        message: 'Não há valor pendente para pagamento.',
      };
    }

    const valueInReais = Number((amountToPayCents / 100).toFixed(2));

    const pixResult = await createPixPaymentOnSubaccount(
      establishment.asaasSubaccountApiKey,
      {
        customerName: session.participantName,
        customerCpf: payerCpf,
        value: valueInReais,
        description: `KeroKero - Mesa ${tableNumber} (${session.participantName})`,
      },
    );

    return {
      success: true,
      message: 'Cobrança PIX gerada com sucesso!',
      data: {
        paymentId: pixResult.paymentId,
        pixQrCodeBase64: pixResult.pixQrCodeBase64,
        pixCopyPaste: pixResult.pixCopyPaste,
        expirationDate: pixResult.expirationDate,
        amountCents: amountToPayCents,
        value: valueInReais,
        mode,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[requestPixCheckoutAction] Erro:', msg);
    return { success: false, message: msg || 'Erro ao gerar cobrança PIX.' };
  }
}

/**
 * Consulta o status da cobrança PIX e liquida o pagamento do participante quando recebido.
 */
export async function pollPixStatusAction(
  paymentId: string,
  amountCents?: number,
): Promise<
  ActionResult<{
    isPaid: boolean;
    status: string;
    sessionClosed?: boolean;
    isParticipantSettled?: boolean;
  }>
> {
  try {
    const session = await authenticateParticipant();
    if (!session) {
      return {
        success: false,
        message: 'Sessão inválida ou expirada.',
      };
    }

    const establishment = await getEstablishmentById(session.establishmentId);
    if (!establishment || !establishment.asaasSubaccountApiKey) {
      return {
        success: false,
        message: 'Configuração PIX do estabelecimento não encontrada.',
      };
    }

    const paymentStatus = await checkSubaccountPaymentStatus(
      establishment.asaasSubaccountApiKey,
      paymentId,
    );

    if (!paymentStatus.isPaid) {
      return {
        success: true,
        data: {
          isPaid: false,
          status: paymentStatus.status,
        },
      };
    }

    // Pagamento confirmado: liquida o valor na sessão da comanda
    let settleAmount = amountCents && amountCents > 0 ? amountCents : 0;

    if (!settleAmount) {
      const orders = await listParticipantOrders(session.sessionId, session.participantId);
      const activeOrders = orders.filter((o) => o.status !== 'cancelled');
      settleAmount = activeOrders.reduce(
        (sum, o) => sum + (o.totalPrice || o.unitPrice * o.quantity),
        0,
      );
    }

    const updatedSession = await settleParticipantPayment(
      session.sessionId,
      session.participantId,
      settleAmount,
    );

    const participants = parseSessionParticipants(updatedSession.participants);
    const participant = participants.find((p) => p.id === session.participantId);
    const isParticipantSettled = participant?.isPaid ?? true;

    // Revoga o cookie de sessão do participante quitado
    if (isParticipantSettled) {
      const cookieStore = await cookies();
      cookieStore.delete(PARTICIPANT_COOKIE_NAME);
    }

    return {
      success: true,
      message: 'Pagamento confirmado com sucesso!',
      data: {
        isPaid: true,
        status: paymentStatus.status,
        sessionClosed: updatedSession.status === 'closed',
        isParticipantSettled,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[pollPixStatusAction] Erro:', msg);
    return { success: false, message: 'Erro ao verificar status do pagamento PIX.' };
  }
}

/**
 * Retorna os dados da sessão ativa do participante armazenada em cookie HttpOnly.
 */
export async function getClientSessionAction(): Promise<
  ActionResult<ParticipantSessionPayload | null>
> {
  try {
    const session = await authenticateParticipant();
    return { success: true, data: session };
  } catch {
    return { success: true, data: null };
  }
}
