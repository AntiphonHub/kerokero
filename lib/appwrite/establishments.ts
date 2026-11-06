import { ID, Query, Models } from 'node-appwrite';
import { createAdminClient } from './server';
import { appwriteConfig } from './config';
import { StoreDataOutput, OperationOutput, SubaccountOutput } from '@/lib/schemas/onboarding';

export interface EstablishmentDocument extends Models.DefaultDocument {
  userId: string;
  name: string;
  legalName?: string;
  cnpj?: string;
  category?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  tablesCount?: number;
  orderMode?: 'direct' | 'waiter_approval';
  openingDays?: string; // JSON string
  openingTime?: string;
  closingTime?: string;
  happyHourEnabled?: boolean;
  happyHourDays?: string; // JSON string
  happyHourStartTime?: string;
  happyHourEndTime?: string;
  repName?: string;
  repCpf?: string;
  repBirthDate?: string;
  bankCode?: string;
  bankPixKey?: string;
  bankAgency?: string;
  bankAccount?: string;
  docIdKey?: string;
  docCnpjKey?: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  subscriptionStatus?: 'pending' | 'active' | 'overdue' | 'canceled';
  asaasSubaccountId?: string;
  asaasWalletId?: string;
  asaasSubaccountApiKey?: string;
  subaccountStatus?: 'pending_documents' | 'under_analysis' | 'approved' | 'rejected';
  onboardingStep: number;
  onboardingCompleted: boolean;
}

function toPlainObject<T>(obj: unknown): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export async function getEstablishmentByUserId(
  userId: string,
): Promise<EstablishmentDocument | null> {
  const { databases } = createAdminClient();
  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    [Query.equal('userId', userId), Query.limit(1)],
  );

  if (res.total === 0 || !res.documents[0]) {
    return null;
  }

  return toPlainObject<EstablishmentDocument>(res.documents[0]);
}

export async function getEstablishmentById(
  establishmentId: string,
): Promise<EstablishmentDocument | null> {
  const { databases } = createAdminClient();
  try {
    const doc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.establishments,
      establishmentId,
    );
    return toPlainObject<EstablishmentDocument>(doc);
  } catch {
    return null;
  }
}

export async function saveStoreDataStep(
  userId: string,
  data: StoreDataOutput,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();
  const existing = await getEstablishmentByUserId(userId);

  const payload = {
    userId,
    name: data.name,
    legalName: data.legalName,
    cnpj: data.cnpj,
    category: data.category,
    phone: data.phone,
    postalCode: data.postalCode,
    address: data.address,
    onboardingStep: 2,
    onboardingCompleted: false,
    subscriptionStatus: 'pending',
    subaccountStatus: 'under_analysis',
  };

  if (existing) {
    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.establishments,
      existing.$id,
      payload,
    );
    return toPlainObject<EstablishmentDocument>(updated);
  }

  const created = await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    ID.unique(),
    payload,
  );
  return toPlainObject<EstablishmentDocument>(created);
}

export async function saveOperationStep(
  establishmentId: string,
  data: OperationOutput,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();

  const payload = {
    tablesCount: data.tablesCount,
    orderMode: data.orderMode,
    openingDays: JSON.stringify(data.openingDays),
    openingTime: data.openingTime,
    closingTime: data.closingTime,
    onboardingStep: 3,
  };

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    establishmentId,
    payload,
  );

  return toPlainObject<EstablishmentDocument>(updated);
}

export interface SaveSubaccountActivationParams {
  subaccount: SubaccountOutput;
  asaas: {
    customerId: string;
    subscriptionId: string;
    subaccountId: string;
    walletId: string;
    subaccountApiKey?: string;
  };
}

export async function saveSubaccountAndActivate(
  establishmentId: string,
  params: SaveSubaccountActivationParams,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();

  const payload = {
    repName: params.subaccount.repName,
    repCpf: params.subaccount.repCpf,
    repBirthDate: params.subaccount.repBirthDate,
    bankCode: params.subaccount.bankCode,
    bankPixKey: params.subaccount.bankPixKey,
    bankAgency: params.subaccount.bankAgency,
    bankAccount: params.subaccount.bankAccount,
    docIdKey: params.subaccount.docIdKey,
    docCnpjKey: params.subaccount.docCnpjKey,
    asaasCustomerId: params.asaas.customerId,
    asaasSubscriptionId: params.asaas.subscriptionId,
    asaasSubaccountId: params.asaas.subaccountId,
    asaasWalletId: params.asaas.walletId,
    asaasSubaccountApiKey: params.asaas.subaccountApiKey || '',
    onboardingStep: 4,
    onboardingCompleted: true,
  };

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    establishmentId,
    payload,
  );

  return toPlainObject<EstablishmentDocument>(updated);
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'pending' | 'overdue' | 'canceled',
): Promise<EstablishmentDocument | null> {
  const { databases } = createAdminClient();

  const res = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    [Query.equal('asaasSubscriptionId', subscriptionId), Query.limit(1)],
  );

  if (res.total === 0 || !res.documents[0]) {
    return null;
  }

  const est = res.documents[0];
  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    est.$id,
    {
      subscriptionStatus: status,
    },
  );

  return toPlainObject<EstablishmentDocument>(updated);
}


export interface HappyHourSettingsInput {
  happyHourEnabled: boolean;
  happyHourDays?: string[];
  happyHourStartTime?: string | null;
  happyHourEndTime?: string | null;
}

export async function updateHappyHourSettings(
  establishmentId: string,
  settings: HappyHourSettingsInput,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();

  const payload: Record<string, unknown> = {
    happyHourEnabled: Boolean(settings.happyHourEnabled),
    happyHourDays: settings.happyHourDays ? JSON.stringify(settings.happyHourDays) : '[]',
    happyHourStartTime: settings.happyHourStartTime || null,
    happyHourEndTime: settings.happyHourEndTime || null,
  };

  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    establishmentId,
    payload,
  );

  return toPlainObject<EstablishmentDocument>(updated);
}


export async function updateEstablishmentBankPixKey(
  establishmentId: string,
  bankPixKey: string,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();
  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    establishmentId,
    {
      bankPixKey,
    },
  );

  return toPlainObject<EstablishmentDocument>(updated);
}


export async function updateEstablishmentData(
  establishmentId: string,
  data: Record<string, unknown>,
): Promise<EstablishmentDocument> {
  const { databases } = createAdminClient();
  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.collections.establishments,
    establishmentId,
    data,
  );
  return toPlainObject<EstablishmentDocument>(updated);
}
