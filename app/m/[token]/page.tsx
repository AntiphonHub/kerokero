import React from 'react';
import { connection } from 'next/server';
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
import { AlertCircle, QrCode, Clock } from 'lucide-react';
import {
  isEstablishmentOpen,
  isHappyHourActive,
  formatOperatingHours,
} from '@/lib/utils/operating-hours';
import { isEstablishmentAccessible } from '@/lib/auth/access-gate';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ClientTablePage(props: PageProps) {
  await connection();
  const resolvedParams = await props.params;
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
  const establishmentName = establishment?.name || 'Bempedi';
  const tableLabel = table.label || `Mesa ${table.number}`;

  // 3b. Verificar se o estabelecimento possui assinatura ou período de testes vigente
  if (establishment && !isEstablishmentAccessible(establishment)) {
    return (
      <PwaShell tableLabel="Atendimento Suspenso" establishmentName={establishmentName}>
        <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
          <div className="size-16 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-500 mb-6 shadow-xs">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
            Atendimento Indisponível
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
            O autoatendimento digital desta mesa está temporariamente suspenso pelo estabelecimento. Por favor, solicite atendimento presencial.
          </p>
        </div>
      </PwaShell>
    );
  }

  // 4. Verificar sessão ativa do participante
  const sessionResult = await getClientSessionAction();
  const activeSession =
    sessionResult.success &&
    sessionResult.data &&
    sessionResult.data.tableId === table.$id
      ? sessionResult.data
      : null;

  // 5. Trava de Horário de Atendimento: se o restaurante estiver fechado e não houver sessão ativa
  const isOpen = isEstablishmentOpen(establishment);
  if (!isOpen && !activeSession) {
    const hoursFormatted = formatOperatingHours(establishment);
    return (
      <PwaShell tableLabel="Restaurante Fechado" establishmentName={establishmentName}>
        <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
          <div className="size-16 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-500 mb-6 shadow-xs">
            <Clock className="size-8" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mb-2 tracking-tight">
            Restaurante Fechado
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mb-4">
            No momento o estabelecimento não está em horário de atendimento presencial.
          </p>
          <div className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs font-medium text-zinc-700">
            {hoursFormatted}
          </div>
        </div>
      </PwaShell>
    );
  }

  const isHappyHour = isHappyHourActive(establishment);

  // 6. Se já tem sessão ativa na mesa, exibe a comanda e o Cardápio Digital integrados
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
          isHappyHour={isHappyHour}
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
