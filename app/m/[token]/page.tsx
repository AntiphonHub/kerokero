import React from 'react';
import { isValidTableToken } from '@/lib/security/table-token';
import { getTableByToken } from '@/lib/appwrite/tables';
import { getEstablishmentById } from '@/lib/appwrite/establishments';
import {
  getProductsByEstablishment,
  getCategoriesByEstablishment,
} from '@/lib/appwrite/products';
import { getTableSession } from '@/lib/appwrite/client-sessions';
import { listSessionOrders } from '@/lib/appwrite/orders';
import { getClientSessionAction } from '@/actions/client';
import { PwaShell } from '@/components/client/pwa-shell';
import { GateFlow } from '@/components/client/gate-flow';
import { ClientApp } from '@/components/client/client-app';
import { AlertCircle, QrCode } from 'lucide-react';

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

  // 5. Se já tem sessão ativa na mesa, exibe a comanda e o Cardápio Digital integrados
  if (activeSession) {
    const [products, categories, sessionDoc, sessionOrders] = await Promise.all([
      getProductsByEstablishment(table.establishmentId),
      getCategoriesByEstablishment(table.establishmentId),
      getTableSession(activeSession.sessionId),
      listSessionOrders(activeSession.sessionId),
    ]);

    return (
      <PwaShell
        tableLabel={tableLabel}
        establishmentName={establishmentName}
        participantName={activeSession.participantName}
      >
        <ClientApp
          initialSession={sessionDoc}
          initialOrders={sessionOrders}
          products={products}
          categories={categories}
          tableToken={token}
          tableLabel={tableLabel}
          establishmentName={establishmentName}
          currentParticipantId={activeSession.participantId}
          currentParticipantName={activeSession.participantName}
          tableNumber={table.number}
        />
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
