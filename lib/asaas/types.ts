export interface AsaasErrorResponse {
  errors?: Array<{
    code?: string;
    description: string;
  }>;
}

export interface AsaasCustomerInput {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasSubscriptionInput {
  customerId: string;
  value: number;
  description?: string;
  nextDueDate?: string;
  cycle?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  status: string;
  cycle?: string;
  nextDueDate?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface AsaasSubaccountInput {
  name: string;
  email: string;
  cpfCnpj: string;
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  incomeValue?: number;
}

export interface AsaasSubaccount {
  id: string;
  name: string;
  email: string;
  walletId: string;
  apiKey?: string;
  accountNumber?: {
    agency: string;
    account: string;
    accountDigit: string;
  };
}

export interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer?: string;
    subscription?: string;
    value?: number;
    status?: string;
    billingType?: string;
  };
}


export interface AsaasBalance {
  balance: number;
  availableBalance: number;
}

export interface CreateTransferInput {
  value: number;
  pixAddressKey?: string;
  pixAddressKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  description?: string;
}

export interface AsaasTransfer {
  id: string;
  dateCreated?: string;
  value: number;
  netValue?: number;
  status: string;
  transferFee?: number;
  effectiveDate?: string;
  scheduleDate?: string;
  type?: string;
  transactionReceiptUrl?: string;
}

export interface AsaasDocumentGroup {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SENT';
  type: string;
  title?: string;
  description?: string;
  responsible?: {
    name?: string;
    cpfCnpj?: string;
    type?: string;
  };
  onboardingUrl?: string | null;
}

export interface AsaasAccountStatus {
  id?: string;
  commercialInfo?: string;
  bankAccountInfo?: string;
  documentation?: string;
  general?: string;
}
