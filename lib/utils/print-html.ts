import { TableDocument } from '@/lib/appwrite/tables';
import { PrintLayout } from '@/lib/schemas/table';

export interface PrintCardOptions {
  tables: TableDocument[];
  layout: PrintLayout;
  bgColor: string;
  textColor: string;
  instructionText: string;
  establishmentName?: string;
  establishmentLogoUrl?: string | null;
  customLogoUrl?: string | null;
  qrSvgMap: Record<string, string>;
  poweredByText?: string;
}

export function generatePrintHtml(options: PrintCardOptions): string {
  const {
    tables,
    layout,
    bgColor,
    textColor,
    instructionText,
    establishmentName,
    establishmentLogoUrl,
    customLogoUrl,
    qrSvgMap,
    poweredByText = 'powered by Bempedi',
  } = options;

  const isNormalizedLayout =
    layout === '2x3' ? 'square' : layout === '3x3' ? 'compact_square' : layout;

  const cardsPerPage =
    isNormalizedLayout === 'compact_square'
      ? 9
      : isNormalizedLayout === 'horizontal'
      ? 8
      : 6;

  const gridCols =
    isNormalizedLayout === 'compact_square' || isNormalizedLayout === 'vertical'
      ? 3
      : 2;

  // Separa em páginas A4
  const pages: TableDocument[][] = [];
  for (let i = 0; i < tables.length; i += cardsPerPage) {
    pages.push(tables.slice(i, i + cardsPerPage));
  }

  const effectiveLogo = customLogoUrl || establishmentLogoUrl;

  const renderCard = (t: TableDocument) => {
    const displayLabel = t.label || `Mesa ${String(t.number).padStart(2, '0')}`;
    const qrSvg = qrSvgMap[t.$id] || '';

    // Layout Horizontal: Alinhamento preciso com início e fim do QR Code
    if (isNormalizedLayout === 'horizontal') {
      return `
        <div class="card card-horizontal" style="background-color: ${bgColor}; color: ${textColor};">
          <div class="qr-box">
            ${qrSvg}
          </div>
          <div class="content-box">
            <div class="brand-header">
              ${
                effectiveLogo
                  ? `<img src="${effectiveLogo}" alt="Logo" class="logo-img-h" />`
                  : `<div class="store-name-h" style="color: ${textColor};">${establishmentName || 'Bempedi'}</div>`
              }
              <div class="powered-by" style="color: ${textColor}; opacity: 0.75;">${poweredByText}</div>
            </div>
            <div class="bottom-box">
              <div class="table-number" style="color: ${textColor};">${displayLabel}</div>
              ${instructionText ? `<div class="instruction" style="color: ${textColor}; opacity: 0.85;">${instructionText}</div>` : ''}
            </div>
          </div>
          <span class="cut-guide">corte</span>
        </div>
      `;
    }

    if (isNormalizedLayout === 'vertical') {
      return `
        <div class="card card-vertical" style="background-color: ${bgColor}; color: ${textColor};">
          <div class="brand-header-center">
            ${
              effectiveLogo
                ? `<img src="${effectiveLogo}" alt="Logo" class="logo-img-v" />`
                : `<div class="store-name-v" style="color: ${textColor};">${establishmentName || 'Bempedi'}</div>`
            }
            <div class="powered-by" style="color: ${textColor}; opacity: 0.75;">${poweredByText}</div>
          </div>
          <div class="qr-box-center">
            ${qrSvg}
          </div>
          <div class="bottom-box-center">
            <div class="table-number-v" style="color: ${textColor};">${displayLabel}</div>
            ${instructionText ? `<div class="instruction-v" style="color: ${textColor}; opacity: 0.85;">${instructionText}</div>` : ''}
          </div>
          <span class="cut-guide">corte</span>
        </div>
      `;
    }

    // Default: Square (compact or standard)
    const isCompact = isNormalizedLayout === 'compact_square';
    return `
      <div class="card ${isCompact ? 'card-square-compact' : 'card-square'}" style="background-color: ${bgColor}; color: ${textColor};">
        <div class="brand-header-center">
          ${
            effectiveLogo
              ? `<img src="${effectiveLogo}" alt="Logo" class="${isCompact ? 'logo-img-sq-compact' : 'logo-img-sq'}" />`
              : `<div class="${isCompact ? 'store-name-compact' : 'store-name'}" style="color: ${textColor};">${establishmentName || 'Bempedi'}</div>`
          }
          <div class="powered-by" style="color: ${textColor}; opacity: 0.75;">${poweredByText}</div>
        </div>
        <div class="qr-box-center ${isCompact ? 'qr-box-compact' : ''}">
          ${qrSvg}
        </div>
        <div class="bottom-box-center">
          <div class="${isCompact ? 'table-number-compact' : 'table-number'}" style="color: ${textColor};">${displayLabel}</div>
          ${instructionText ? `<div class="instruction" style="color: ${textColor}; opacity: 0.85;">${instructionText}</div>` : ''}
        </div>
        <span class="cut-guide">corte</span>
      </div>
    `;
  };

  const pagesHtml = pages
    .map((pageTables, pageIdx) => {
      const isLast = pageIdx === pages.length - 1;
      return `
        <div class="a4-page ${isLast ? 'last-page' : ''}" style="grid-template-columns: repeat(${gridCols}, 1fr);">
          ${pageTables.map(renderCard).join('')}
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Imprimir Cartões de Mesa - Bempedi</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page {
          size: A4 portrait;
          margin: 6mm 6mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
        }
        .a4-page {
          width: 198mm;
          min-height: 282mm;
          display: grid;
          gap: 3mm;
          justify-content: center;
          align-content: start;
          page-break-after: always;
          break-after: page;
          padding: 2mm;
        }
        .a4-page.last-page {
          page-break-after: avoid;
          break-after: avoid;
        }
        .card {
          position: relative;
          border: 1px dashed #D4D4D8;
          overflow: hidden;
          box-sizing: border-box;
        }
        .cut-guide {
          position: absolute;
          bottom: 1.5mm;
          right: 2.5mm;
          font-size: 6.5px;
          color: #A1A1AA;
          opacity: 0.5;
        }

        /* --- Template Horizontal (3:2) com Alinhamento Preciso --- */
        .card-horizontal {
          width: 95mm;
          height: 58mm;
          padding: 3.5mm 5mm;
          border-radius: 4.5mm;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 4mm;
        }
        .card-horizontal .qr-box {
          background: #ffffff;
          border-radius: 3mm;
          padding: 1mm;
          width: 42mm;
          height: 42mm;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          border: 1px solid #E4E4E7;
        }
        .card-horizontal .qr-box svg {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
        .card-horizontal .content-box {
          flex: 1;
          height: 42mm; /* Rigorosamente idêntico à altura do QR Code! */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          padding: 0.5mm 0;
        }
        .logo-img-h {
          height: 6mm;
          max-width: 38mm;
          object-fit: contain;
          display: block;
        }
        .store-name-h {
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
          line-height: 1;
        }
        .card-horizontal .brand-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          line-height: 1;
          margin-top: -1.5px; /* Compensa o leading superior da fonte para nivelar exatamente com a borda do QR */
        }
        .card-horizontal .bottom-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          line-height: 1;
          margin-bottom: -1.5px; /* Compensa o leading inferior da fonte para nivelar exatamente com a base do QR */
        }

        /* --- Template Quadrado (1:1) --- */
        .card-square {
          width: 90mm;
          height: 90mm;
          padding: 4.5mm;
          border-radius: 4.5mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }
        .card-square-compact {
          width: 61mm;
          height: 61mm;
          padding: 2.5mm;
          border-radius: 3mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }
        .qr-box-center {
          background: #ffffff;
          border-radius: 3mm;
          padding: 1.5mm;
          width: 44mm;
          height: 44mm;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .qr-box-center svg {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
        .qr-box-compact {
          width: 32mm;
          height: 32mm;
          padding: 1mm;
        }

        /* --- Template Vertical (2:3) --- */
        .card-vertical {
          width: 62mm;
          height: 108mm;
          padding: 3.5mm;
          border-radius: 4.5mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }
        .logo-img-v {
          height: 7mm;
          max-width: 35mm;
          object-fit: contain;
        }
        .store-name-v {
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }
        .table-number-v {
          font-weight: 900;
          font-size: 16px;
          letter-spacing: -0.3px;
        }
        .instruction-v {
          font-size: 7.5px;
          font-weight: 500;
          line-height: 1.2;
          margin-top: 1mm;
        }

        /* Tipografia Comum */
        .brand-header-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .store-name {
          font-weight: 900;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }
        .store-name-compact {
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
        }
        .powered-by {
          font-size: 7.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-top: 0.5mm;
        }
        .logo-img-sq {
          height: 7.5mm;
          max-width: 45mm;
          object-fit: contain;
        }
        .logo-img-sq-compact {
          height: 5mm;
          max-width: 32mm;
          object-fit: contain;
        }
        .table-number {
          font-weight: 900;
          font-size: 18px;
          letter-spacing: -0.4px;
          line-height: 1;
        }
        .table-number-compact {
          font-weight: 900;
          font-size: 13px;
          letter-spacing: -0.2px;
          line-height: 1;
        }
        .instruction {
          font-size: 8.5px;
          font-weight: 500;
          line-height: 1.25;
          margin-top: 1.2mm;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;
}

export function printCardsViaIframe(options: PrintCardOptions): void {
  const html = generatePrintHtml(options);

  const existingFrame = document.getElementById('kerokero-print-iframe');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'kerokero-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Falha ao acionar impressão:', e);
      }
    }, 250);
  };
}
