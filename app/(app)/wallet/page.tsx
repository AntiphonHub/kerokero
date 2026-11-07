import { redirect } from 'next/navigation';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import { getWalletDataAction, WalletData } from '@/actions/wallet';
import { WalletView } from '@/components/wallet/wallet-view';

export const metadata = {
  title: 'Carteira & Saques | Bempedi',
  description: 'Consulte seu saldo PIX em tempo real e realize saques para sua conta bancária.',
};

export default async function WalletPage() {
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  const walletRes = await getWalletDataAction();

  const fallbackData: WalletData = {
    balance: 0,
    availableBalance: 0,
    bankPixKey: establishment.bankPixKey,
    bankCode: establishment.bankCode,
    bankAgency: establishment.bankAgency,
    bankAccount: establishment.bankAccount,
    repName: establishment.repName,
    establishmentName: establishment.name,
    subaccountStatus: establishment.subaccountStatus,
    transfers: [],
  };

  const initialData = walletRes.success && walletRes.data ? walletRes.data : fallbackData;

  return (
    <div className="p-4 md:p-8">
      <WalletView initialData={initialData} />
    </div>
  );
}
