'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableDocument } from '@/lib/appwrite/tables';
import { TableCardItem } from './table-card-item';
import { PrintLayout } from '@/lib/schemas/table';
import { generateQrCodeSvg } from '@/lib/utils/qrcode-svg';
import { hexToRgb, rgbToHex, getContrastTextColor } from '@/lib/utils/color';
import { printCardsViaIframe } from '@/lib/utils/print-html';
import {
  Printer,
  LayoutGrid,
  Columns,
  Rows,
  Palette,
  Type,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TableCardPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: TableDocument[];
  establishmentName?: string;
  establishmentLogoUrl?: string | null;
  appBaseUrl?: string;
}

interface TemplateOption {
  id: PrintLayout;
  label: string;
  sublabel: string;
  cardsPerPage: number;
  icon: React.ComponentType<{ className?: string }>;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'square',
    label: 'Quadrado (1:1)',
    sublabel: '6 por folha (2x3) - 8.8cm',
    cardsPerPage: 6,
    icon: LayoutGrid,
  },
  {
    id: 'compact_square',
    label: 'Econômico (1:1)',
    sublabel: '9 por folha (3x3) - 6.2cm',
    cardsPerPage: 9,
    icon: LayoutGrid,
  },
  {
    id: 'vertical',
    label: 'Vertical / Display',
    sublabel: '6 por folha (3x2) - 6.4x10.6cm',
    cardsPerPage: 6,
    icon: Columns,
  },
  {
    id: 'horizontal',
    label: 'Horizontal / Faixa',
    sublabel: '8 por folha (2x4) - 9.6x5.8cm',
    cardsPerPage: 8,
    icon: Rows,
  },
];

export function TableCardPrintDialog({
  open,
  onOpenChange,
  tables,
  establishmentName,
  establishmentLogoUrl,
  appBaseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: TableCardPrintDialogProps) {
  const [layout, setLayout] = useState<PrintLayout>('square');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [textColor, setTextColor] = useState<string>('#121212');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState<string>(
    'Aponte a câmera para fazer seu pedido e fechar a conta',
  );
  const [qrSvgMap, setQrSvgMap] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // RGB State para sincronização bidirecional
  const rgbValues = useMemo(() => {
    return hexToRgb(bgColor) || { r: 255, g: 255, b: 255 };
  }, [bgColor]);

  // Atualiza a cor de fundo garantindo integridade e calcula contraste
  const handleBgColorChange = (newHex: string) => {
    setBgColor(newHex);
    setTextColor(getContrastTextColor(newHex));
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const current = { ...rgbValues, [channel]: Math.max(0, Math.min(255, value)) };
    const newHex = rgbToHex(current.r, current.g, current.b);
    setBgColor(newHex);
    setTextColor(getContrastTextColor(newHex));
  };

  // Upload local de logo transparente (PNG/WebP/SVG)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida (PNG, SVG ou WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomLogoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const activeTemplate = useMemo(() => {
    return TEMPLATES.find((t) => t.id === layout) || TEMPLATES[0];
  }, [layout]);

  // Gera SVGs de QR Code para todas as mesas
  // O QR Code fica dentro de uma caixa branca para leitura ótica perfeita.
  // Portanto, os módulos do QR Code devem ser sempre escuros (#121212).
  useEffect(() => {
    if (!open || tables.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    async function generateAll() {
      const map: Record<string, string> = {};

      for (const t of tables) {
        const url = `${appBaseUrl}/m/${t.token}`;
        const svg = await generateQrCodeSvg(url, {
          color: {
            dark: '#121212', // Sempre escuro para contraste perfeito na caixa branca
            light: '#00000000',
          },
        });
        map[t.$id] = svg;
      }

      if (isMounted) {
        setQrSvgMap(map);
        setIsGenerating(false);
      }
    }

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [open, tables, appBaseUrl]);

  // Total de folhas necessárias
  const totalPages = Math.ceil(tables.length / activeTemplate.cardsPerPage) || 1;

  const handlePrint = () => {
    printCardsViaIframe({
      tables,
      layout,
      bgColor,
      textColor,
      instructionText,
      establishmentName,
      establishmentLogoUrl,
      customLogoUrl,
      qrSvgMap,
      poweredByText: 'powered by Bempedi',
    });
  };

  const sampleTable = tables[0] || {
    $id: 'sample',
    number: 1,
    label: 'Mesa 01',
    token: 'sample-token',
  };
  const sampleQrSvg = qrSvgMap[sampleTable.$id] || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] flex flex-col bg-white">
        {/* Header com padding-right reservado (pr-16) para não sobrepor o botão X de fechar */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 flex flex-row items-center justify-between pr-16">
          <div>
            <DialogTitle className="text-lg font-bold text-zinc-900 tracking-tight">
              Personalizar e Imprimir Cartões de Mesa
            </DialogTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              Escolha o formato, envie seu logo transparente e imprima economizando papel.
            </p>
          </div>

          {/* Botão de Destaque em Amarelo Âmbar com Texto Branco */}
          <Button
            onClick={handlePrint}
            disabled={isGenerating}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 h-9 gap-1.5 rounded-xl cursor-pointer shadow-xs transition-colors shrink-0 mr-2"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Cartões
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Painel de Customização */}
          <div className="md:col-span-6 flex flex-col gap-5">
            {/* 1. Seleção de Formato do Cartão (Templates) */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5 mb-2">
                <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                Formato do Cartão
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  const isSelected = layout === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setLayout(tmpl.id)}
                      className={cn(
                        'p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between',
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('w-3.5 h-3.5', isSelected ? 'text-amber-600' : 'text-zinc-400')} />
                        <span className="text-xs font-bold text-zinc-900">{tmpl.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1">{tmpl.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Logo Transparente da Empresa */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5 mb-2">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                Logotipo da Empresa
              </label>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50/60">
                {customLogoUrl ? (
                  <div className="relative flex items-center justify-center p-1 bg-white rounded-lg border border-zinc-200 h-12 w-20 shrink-0">
                    <img
                      src={customLogoUrl}
                      alt="Logo Custom"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-20 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center bg-white text-zinc-400 shrink-0 text-[10px] text-center p-1 font-medium">
                    Sem logo
                  </div>
                )}

                <div className="flex flex-col gap-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs font-medium border-zinc-300 hover:border-zinc-400 text-zinc-700 gap-1 rounded-lg cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      {customLogoUrl ? 'Trocar Logo' : 'Enviar Logo Transparente'}
                    </Button>

                    {customLogoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomLogoUrl(null)}
                        className="h-7 px-2 text-zinc-400 hover:text-red-600 rounded-lg cursor-pointer"
                        title="Remover logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Recomendado: PNG ou SVG com fundo transparente.
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Color Wheel, Hex e RGB */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                Cor do Cartão (Color Wheel / HEX / RGB)
              </label>

              <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* Color Picker Circular (Color Wheel nativa) */}
                  <div className="relative w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0 cursor-pointer">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => handleBgColorChange(e.target.value)}
                      className="absolute -top-3 -left-3 w-16 h-16 cursor-pointer border-0 p-0"
                    />
                  </div>

                  {/* Campo HEX */}
                  <div className="flex-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
                      Código HEX
                    </span>
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => handleBgColorChange(e.target.value)}
                      maxLength={7}
                      className="w-full font-mono text-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-900 bg-white uppercase focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Campos RGB */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200/60">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">R (Vermelho)</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgbValues.r}
                      onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                      className="w-full font-mono text-xs rounded-lg border border-zinc-200 px-2 py-1 text-zinc-900 bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">G (Verde)</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgbValues.g}
                      onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                      className="w-full font-mono text-xs rounded-lg border border-zinc-200 px-2 py-1 text-zinc-900 bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">B (Azul)</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={rgbValues.b}
                      onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                      className="w-full font-mono text-xs rounded-lg border border-zinc-200 px-2 py-1 text-zinc-900 bg-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Texto de Instrução */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5 mb-1.5">
                <Type className="w-3.5 h-3.5 text-amber-500" />
                Instrução do Cartão
              </label>
              <input
                type="text"
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                maxLength={90}
                className="w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Coluna da Direita: Pré-visualização ao Vivo */}
          <div className="md:col-span-6 flex flex-col items-center justify-center bg-zinc-100/70 p-6 rounded-2xl border border-zinc-200/70 min-h-[360px]">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              Pré-visualização do Formato ({activeTemplate.label})
            </span>

            <div className="shadow-lg rounded-2xl overflow-hidden transition-all scale-100 hover:scale-[1.02]">
              <TableCardItem
                tableNumber={sampleTable.number}
                tableLabel={sampleTable.label}
                qrSvg={sampleQrSvg}
                establishmentName={establishmentName}
                establishmentLogoUrl={establishmentLogoUrl}
                customLogoUrl={customLogoUrl}
                instructionText={instructionText}
                bgColor={bgColor}
                textColor={textColor}
                layout={layout}
                showCutGuides={true}
              />
            </div>

            <div className="mt-4 p-2.5 bg-white/80 rounded-xl border border-zinc-200/70 text-[11px] text-zinc-500 text-center w-full max-w-sm">
              <span className="font-semibold text-zinc-900">{activeTemplate.cardsPerPage} cartões</span> por folha A4.
              Total de <span className="font-semibold text-zinc-900">{totalPages} folha(s)</span> para {tables.length} mesas.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
