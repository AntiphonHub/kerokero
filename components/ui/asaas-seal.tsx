import React from 'react';
import {
  ASAAS_SEAL_URL,
  ASAAS_REDIRECT_URL,
  ASAAS_REGULATORY_DISCLAIMER,
  getAsaasSealDimensions,
  type AsaasSealSize,
} from '@/lib/config/asaas-seal';

export interface AsaasSealProps {
  size?: AsaasSealSize;
  showDisclaimer?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

/**
 * Componente oficial do Selo BaaS Asaas homologado
 * Em conformidade com o Playbook BaaS Asaas e a Resolução Conjunta nº 16/2025 do BACEN.
 */
export function AsaasSeal({
  size = 'default',
  showDisclaimer = false,
  align = 'left',
  className = '',
}: AsaasSealProps) {
  const { width, height } = getAsaasSealDimensions(size);

  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align];

  return (
    <div className={`inline-flex flex-col gap-1.5 ${alignClasses} ${className}`}>
      <a
        href={ASAAS_REDIRECT_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="Serviços financeiros prestados por Asaas Gestão Financeira IP S.A."
        className="inline-block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-amber-500/40 rounded-sm"
      >
        {/*
          IMPORTANTE: Não utilizar referrerPolicy="no-referrer" na tag <img>,
          pois o Asaas audita a origem da aplicação pelo cabeçalho Referer.
        */}
        <img
          src={ASAAS_SEAL_URL}
          alt="Selo Banco Asaas"
          width={width}
          height={height}
          style={{ display: 'inline-block' }}
          className="shrink-0 object-contain"
        />
      </a>

      {showDisclaimer && (
        <span className="text-[10.5px] text-zinc-400 font-normal leading-tight max-w-xs">
          {ASAAS_REGULATORY_DISCLAIMER}
        </span>
      )}
    </div>
  );
}
