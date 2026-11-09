'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Building2,
  KeyRound,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { WalletData, getWalletDataAction } from '@/actions/wallet';
import { AsaasDocumentGroup } from '@/lib/asaas/types';
import { formatBrasiliaDateTime } from '@/lib/formatters';
import { WithdrawDialog } from './withdraw-dialog';
import { UploadDocumentModal } from './upload-document-modal';

interface WalletViewProps {
  initialData: WalletData;
}

export function WalletView({ initialData }: WalletViewProps) {
  const [data, setData] = useState<WalletData>(initialData);
  const [isRefreshing, startTransition] = useTransition();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<AsaasDocumentGroup | null>(null);

  const refreshData = () => {
    startTransition(async () => {
      const res = await getWalletDataAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    });
  };

  const formatBrl = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <CheckCircle2 className="w-3 h-3" />
            Concluído
          </span>
        );
      case 'PENDING':
      case 'BANK_PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
            <Clock className="w-3 h-3" />
            Em processamento
          </span>
        );
      case 'CANCELLED':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200/70">
            <XCircle className="w-3 h-3" />
            Falhou
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-zinc-900" />
            Carteira & Saques
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Gerencie os recebimentos via PIX da sua operação e transfira para sua conta bancária.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="h-9 px-3 text-xs font-medium text-zinc-700 border-zinc-200 hover:bg-zinc-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Banner de Verificação KYC / Asaas */}
      {data.subaccountStatus !== 'approved' && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-zinc-900">
                Verificação de Identidade (KYC) para Saques
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-2xl">
                {data.onboardingUrl
                  ? 'Por exigência regulatória do Banco Central, complete a validação biométrica (selfie com prova de vida) e envio de documentos no ambiente seguro do Asaas para liberar saques e transferências externas.'
                  : data.pendingDocuments && data.pendingDocuments.length > 0
                  ? 'Envie os documentos solicitados pelo Asaas abaixo para liberar saques externos da sua conta.'
                  : 'Sua documentação está em processo de validação pelo Asaas. A liberação de saques ocorre em até 2 horas úteis.'}
              </p>

              {/* Lista de documentos pendentes quando não há link externo de onboardingUrl */}
              {!data.onboardingUrl && data.pendingDocuments && data.pendingDocuments.length > 0 && (
                <div className="pt-2 space-y-2">
                  {data.pendingDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs"
                    >
                      <div>
                        <strong className="block text-xs font-bold text-zinc-900">
                          {doc.title || doc.type}
                        </strong>
                        {doc.description && (
                          <span className="text-[11px] text-zinc-500 leading-tight block mt-0.5">
                            {doc.description}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer transition-colors shadow-2xs"
                      >
                        Enviar Arquivo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.onboardingUrl && (
            <a
              href={data.onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs"
            >
              <span>Completar no Asaas</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Grid Superior: Saldos e Ação Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Saldo Disponível (Destaque Principal) */}
        <div className="md:col-span-2 bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Saldo Disponível para Saque
            </span>
            <div className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 font-mono">
              {formatBrl(data.availableBalance)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Disponível para transferência bancária instantânea via PIX 24/7.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              Chave Pix: <strong className="text-zinc-800 font-mono">{data.bankPixKey || 'Não cadastrada'}</strong>
            </div>
            <Button
              onClick={() => setWithdrawOpen(true)}
              disabled={data.availableBalance <= 0}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-5 h-10 shadow-xs cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5 text-amber-500" />
              Solicitar Saque via PIX
            </Button>
          </div>
        </div>

        {/* Card Saldo Total & Subconta */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Saldo Total da Conta
            </span>
            <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-800 font-mono">
              {formatBrl(data.balance)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Inclui saldo bloqueado ou em processamento temporário.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 space-y-1.5">
            <div className="text-xs font-medium text-zinc-700">Subconta no Asaas:</div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-800">
              {data.subaccountStatus === 'approved' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-semibold">Verificada e Aprovada</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-800 font-medium">Validação Pendente</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Dados Bancários de Destino */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-zinc-700" />
          Dados Bancários Cadastrados
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              Chave PIX
            </div>
            <div className="text-sm font-semibold text-zinc-900 font-mono truncate">
              {data.bankPixKey || 'Não informada'}
            </div>
          </div>

          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <Building2 className="w-3.5 h-3.5" />
              Banco
            </div>
            <div className="text-sm font-semibold text-zinc-900 font-mono">
              {data.bankCode ? `Cód. ${data.bankCode}` : 'Não informado'}
            </div>
          </div>

          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <div className="text-xs text-zinc-500 mb-1">Agência / Conta</div>
            <div className="text-sm font-semibold text-zinc-900 font-mono">
              {data.bankAgency && data.bankAccount
                ? `Ag: ${data.bankAgency} / CC: ${data.bankAccount}`
                : 'Não informada'}
            </div>
          </div>

          <div className="p-3 bg-zinc-50/70 border border-zinc-200/60 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              Titular
            </div>
            <div className="text-sm font-semibold text-zinc-900 truncate">
              {data.repName || data.establishmentName || 'Não informado'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico de Saques */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Histórico de Transferências & Saques
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Registro das transferências via PIX emitidas pela sua conta.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono font-medium">
            {data.transfers.length} {data.transfers.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {data.transfers.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              Nenhuma transferência realizada ainda
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Assim que você solicitar um saque via PIX, os comprovantes e status da transação aparecerão listados aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Identificador</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {data.transfers.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-zinc-600 font-mono">
                      {formatBrasiliaDateTime(item.dateCreated || item.effectiveDate)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-zinc-500">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-zinc-900">
                      {formatBrl(item.value)}
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.transactionReceiptUrl ? (
                        <a
                          href={item.transactionReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          Ver Recibo
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Saque */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={data.availableBalance}
        bankPixKey={data.bankPixKey}
        repName={data.repName}
        establishmentName={data.establishmentName}
        onSuccess={refreshData}
      />

      {/* Modal de Upload de Documento BaaS */}
      <UploadDocumentModal
        open={!!selectedDoc}
        onOpenChange={(open) => !open && setSelectedDoc(null)}
        documentGroup={selectedDoc}
        onSuccess={refreshData}
      />
    </div>
  );
}
