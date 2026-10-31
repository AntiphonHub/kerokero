import type { Metadata } from 'next';
import { getLoggedInUser } from '@/lib/appwrite/session';

export const metadata: Metadata = {
  title: 'Dashboard | KeroKero',
  description: 'Painel operacional do lojista',
};

export const instant = false;

export default async function DashboardPage() {
  const user = await getLoggedInUser();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Olá, {user?.name || 'Lojista'}!
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Bem-vindo ao painel de gestão da comanda digital KeroKero.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Status da Loja</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-base font-semibold text-zinc-900">Operação Ativa</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Pronto para receber pedidos nas mesas</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Mesas Ativas</p>
          <p className="mt-3 text-3xl font-extrabold text-zinc-900">0</p>
          <p className="mt-2 text-xs text-zinc-500">Nenhuma comanda aberta no momento</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total de Pedidos Hoje</p>
          <p className="mt-3 text-3xl font-extrabold text-zinc-900">R$ 0,00</p>
          <p className="mt-2 text-xs text-zinc-500">0 pedidos processados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-2">Conta & Perfil</h2>
        <div className="text-xs space-y-1 text-zinc-600 font-mono">
          <p><strong className="font-semibold text-zinc-800">ID:</strong> {user?.$id}</p>
          <p><strong className="font-semibold text-zinc-800">E-mail:</strong> {user?.email}</p>
          <p><strong className="font-semibold text-zinc-800">Telefone:</strong> {user?.phone || 'Não informado'}</p>
        </div>
      </div>
    </div>
  );
}
