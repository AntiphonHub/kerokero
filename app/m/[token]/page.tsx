import React from 'react';
import { isValidTableToken } from '@/lib/security/table-token';
import { getTableByToken } from '@/lib/appwrite/tables';
import { getEstablishmentById } from '@/lib/appwrite/establishments';
import { getClientSessionAction } from '@/actions/client';
import { PwaShell } from '@/components/client/pwa-shell';
import { GateFlow } from '@/components/client/gate-flow';
import { AlertCircle, QrCode, CheckCircle2, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }> | { token: string };
}

export default async function ClientTablePage(props: PageProps) {
  const resolvedParams = await Promise.resolve(props.params);
  const token = resolvedParams?.token;

  // 1. Validar formato do token
  if (!token || !isValidTableToken(token)) {
    return (
      <PwaShell tableLabel="Acesso Bloqueado">
        <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
          <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mb-6 shadow-xs">
            <QrCode className="size-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
            Código Inválido
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
            O QR Code escaneado não é válido ou está mal formatado. Por favor, aponte a câmera novamente para o QR Code da mesa.
          </p>
        </div>
      </PwaShell>
    );
  }

  // 2. Carregar dados da mesa
  const table = await getTableByToken(token);
  if (!table || !table.isActive) {
    return (
      <PwaShell tableLabel="Mesa Indisponível">
        <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
          <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
            Mesa Não Encontrada
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
            Esta mesa não está ativa ou não foi encontrada no sistema. Solicite ajuda a um atendente.
          </p>
        </div>
      </PwaShell>
    );
  }

  // 3. Buscar nome do estabelecimento
  const establishment = await getEstablishmentById(table.establishmentId);
  const establishmentName = establishment?.name || 'KeroKero';
  const tableLabel = table.label || `Mesa ${table.number}`;

  // 4. Verificar sessão ativa do participante
  const sessionResult = await getClientSessionAction();
  const activeSession =
    sessionResult.success &&
    sessionResult.data &&
    sessionResult.data.tableId === table.$id
      ? sessionResult.data
      : null;

  // 5. Se já tem sessão ativa na mesa, exibe a comanda aberta (Pronta para o Menu/Cardápio)
  if (activeSession) {
    return (
      <PwaShell
        tableLabel={tableLabel}
        establishmentName={establishmentName}
        participantName={activeSession.participantName}
      >
        <div className="flex flex-col flex-1 p-4 animate-in fade-in duration-300">
          {/* Banner de Sessão Ativa */}
          <div className="rounded-2xl bg-white border border-zinc-200/80 p-5 shadow-xs mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="size-3.5" />
                Comanda Ativa
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="size-3" />
                Em andamento
              </span>
            </div>

            <h2 className="text-lg font-bold text-zinc-900">
              Olá, {activeSession.participantName}!
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Você está conectado à {tableLabel}. Seus pedidos e divisões de conta serão sincronizados em tempo real.
            </p>
          </div>

          {/* Placeholder para Menu Digital e Comanda (Task 7 & 8) */}
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center text-zinc-400">
            <p className="text-sm font-medium text-zinc-600">
              Cardápio Digital
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Selecione produtos, personalize pedidos e envie direto para a cozinha.
            </p>
          </div>
        </div>
      </PwaShell>
    );
  }

  // 6. Sem sessão ativa: renderiza os Gates de Acesso (Geolocalização -> Apelido)
  return (
    <PwaShell tableLabel={tableLabel} establishmentName={establishmentName}>
      <GateFlow
        token={token}
        tableNumber={table.number}
        tableLabel={tableLabel}
        establishmentName={establishmentName}
      />
    </PwaShell>
  );
}
