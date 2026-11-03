import React from 'react';
import { cn } from '@/lib/utils';
import { PrintLayout } from '@/lib/schemas/table';

export interface TableCardItemProps {
  tableNumber: number;
  tableLabel?: string;
  qrSvg: string;
  establishmentName?: string;
  establishmentLogoUrl?: string | null;
  customLogoUrl?: string | null;
  poweredByText?: string;
  instructionText?: string;
  bgColor?: string;
  textColor?: string;
  layout?: PrintLayout;
  showCutGuides?: boolean;
  className?: string;
}

export function TableCardItem({
  tableNumber,
  tableLabel,
  qrSvg,
  establishmentName,
  establishmentLogoUrl,
  customLogoUrl,
  poweredByText = 'powered by Bempedi',
  instructionText = 'Aponte a câmera para fazer seu pedido e fechar a conta',
  bgColor = '#FFFFFF',
  textColor = '#121212',
  layout = 'square',
  showCutGuides = true,
  className,
}: TableCardItemProps) {
  const displayLabel = tableLabel || `Mesa ${String(tableNumber).padStart(2, '0')}`;
  const effectiveLogo = customLogoUrl || establishmentLogoUrl;

  const isNormalizedLayout =
    layout === '2x3' ? 'square' : layout === '3x3' ? 'compact_square' : layout;

  // 1. Template Horizontal: Topo e Base alinhados com precisão pixel-perfect ao QR Code
  if (isNormalizedLayout === 'horizontal') {
    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: showCutGuides ? '#D4D4D8' : 'transparent',
        }}
        className={cn(
          'relative flex flex-row items-center justify-center text-left select-none overflow-hidden transition-all',
          showCutGuides && 'border border-dashed',
          'w-[96mm] h-[58mm] px-5 py-3 rounded-2xl gap-4',
          className,
        )}
      >
        {/* Coluna Esquerda: QR Code com dimensões travadas (42mm x 42mm) */}
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-white p-1 shadow-2xs shrink-0 w-[42mm] h-[42mm]',
            bgColor === '#FFFFFF' ? 'border border-zinc-200/90' : 'border border-white/20',
          )}
        >
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        {/* Coluna Direita: Altura exatamente 42mm, compensando leading de fonte para alinhamento ótico perfeito */}
        <div className="flex flex-col justify-between h-[42mm] flex-1 overflow-hidden py-0.5">
          {/* Topo: Início nivelado exatamente com a borda superior do QR Code */}
          <div className="flex flex-col items-start leading-none -mt-0.5">
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={establishmentName || 'Logo'}
                className="h-6 max-w-[125px] object-contain drop-shadow-xs"
              />
            ) : (
              <span
                className="font-black text-sm uppercase tracking-tight truncate max-w-full leading-none"
                style={{ color: textColor }}
              >
                {establishmentName || 'KeroKero'}
              </span>
            )}
            <span
              className="text-[8px] font-semibold tracking-wider uppercase mt-1 leading-none"
              style={{ color: textColor, opacity: 0.75 }}
            >
              {poweredByText}
            </span>
          </div>

          {/* Base: Fim nivelado exatamente com a borda inferior do QR Code */}
          <div className="flex flex-col items-start leading-none -mb-0.5">
            <h2
              className="font-black text-xl tracking-tight leading-none"
              style={{ color: textColor }}
            >
              {displayLabel}
            </h2>
            {instructionText && (
              <p
                className="text-[9px] font-medium leading-snug line-clamp-2 mt-1.5"
                style={{ color: textColor, opacity: 0.85 }}
              >
                {instructionText}
              </p>
            )}
          </div>
        </div>

        {showCutGuides && (
          <span className="absolute bottom-1 right-2 text-[7px] text-zinc-300 pointer-events-none select-none print:hidden">
            corte
          </span>
        )}
      </div>
    );
  }

  // 2. Template Vertical (Display Acrílico / Torre)
  if (isNormalizedLayout === 'vertical') {
    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: showCutGuides ? '#D4D4D8' : 'transparent',
        }}
        className={cn(
          'relative flex flex-col items-center justify-between text-center select-none overflow-hidden transition-all',
          showCutGuides && 'border border-dashed',
          'w-[64mm] h-[106mm] p-4 rounded-2xl',
          className,
        )}
      >
        {/* Topo: Logo ou Nome + powered by Bempedi */}
        <div className="flex flex-col items-center w-full">
          {effectiveLogo ? (
            <img
              src={effectiveLogo}
              alt={establishmentName || 'Logo'}
              className="h-8 max-w-[110px] object-contain drop-shadow-xs"
            />
          ) : (
            <span
              className="font-black text-xs uppercase tracking-tight truncate max-w-full"
              style={{ color: textColor }}
            >
              {establishmentName || 'KeroKero'}
            </span>
          )}
          <span
            className="text-[8px] font-semibold tracking-wider uppercase mt-1"
            style={{ color: textColor, opacity: 0.75 }}
          >
            {poweredByText}
          </span>
        </div>

        {/* Centro: QR Code Amplo */}
        <div
          className="flex items-center justify-center rounded-xl bg-white p-2 shadow-2xs border border-zinc-100 w-[42mm] h-[42mm] my-auto [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        {/* Base: Número da Mesa + Instrução */}
        <div className="flex flex-col items-center w-full">
          <h2
            className="font-black text-xl tracking-tight leading-tight"
            style={{ color: textColor }}
          >
            {displayLabel}
          </h2>
          {instructionText && (
            <p
              className="text-[8.5px] font-medium leading-tight max-w-[95%] mt-1.5"
              style={{ color: textColor, opacity: 0.85 }}
            >
              {instructionText}
            </p>
          )}
        </div>

        {showCutGuides && (
          <span className="absolute bottom-1 right-2 text-[7px] text-zinc-300 pointer-events-none select-none print:hidden">
            corte
          </span>
        )}
      </div>
    );
  }

  // 3. Template Quadrado (Padrão ou Compacto)
  const isCompact = isNormalizedLayout === 'compact_square';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: showCutGuides ? '#D4D4D8' : 'transparent',
      }}
      className={cn(
        'relative flex flex-col items-center justify-between text-center select-none overflow-hidden transition-all',
        showCutGuides && 'border border-dashed',
        !isCompact ? 'w-[88mm] h-[88mm] p-4 rounded-2xl' : 'w-[62mm] h-[62mm] p-2.5 rounded-xl',
        className,
      )}
    >
      {/* Topo: Logo ou Nome + powered by Bempedi */}
      <div className="flex flex-col items-center justify-center w-full">
        {effectiveLogo ? (
          <img
            src={effectiveLogo}
            alt={establishmentName || 'Logo'}
            className={cn(
              'object-contain mx-auto drop-shadow-xs',
              isCompact ? 'h-5 max-w-[70px]' : 'h-8 max-w-[120px]',
            )}
          />
        ) : (
          <span
            className={cn(
              'font-black tracking-tight uppercase truncate max-w-full',
              isCompact ? 'text-[10px] leading-tight' : 'text-sm',
            )}
            style={{ color: textColor }}
          >
            {establishmentName || 'KeroKero'}
          </span>
        )}

        <span
          className={cn(
            'font-semibold tracking-wider uppercase',
            isCompact ? 'text-[7.5px] mt-0.5' : 'text-[9.5px] mt-1',
          )}
          style={{ color: textColor, opacity: 0.75 }}
        >
          {poweredByText}
        </span>
      </div>

      {/* Centro: QR Code Vetorial SVG no container branco */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-white shadow-2xs border border-zinc-100 [&>svg]:w-full [&>svg]:h-full',
          isCompact ? 'w-[32mm] h-[32mm] p-1' : 'w-[44mm] h-[44mm] p-1.5',
        )}
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      {/* Base: Número da Mesa + Instrução */}
      <div className="flex flex-col items-center w-full">
        <h2
          className={cn(
            'font-black tracking-tight',
            isCompact ? 'text-sm' : 'text-xl',
          )}
          style={{ color: textColor }}
        >
          {displayLabel}
        </h2>
        {instructionText && (
          <p
            className={cn(
              'font-medium leading-tight max-w-[90%]',
              isCompact ? 'text-[7.5px] mt-0.5 line-clamp-1' : 'text-[10px] mt-1',
            )}
            style={{ color: textColor, opacity: 0.85 }}
          >
            {instructionText}
          </p>
        )}
      </div>

      {showCutGuides && (
        <span className="absolute bottom-1 right-2 text-[7px] text-zinc-300 pointer-events-none select-none print:hidden">
          corte
        </span>
      )}
    </div>
  );
}
