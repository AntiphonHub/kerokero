'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, Check } from 'lucide-react';
import { saveHappyHourSettingsAction } from '@/actions/products';

export interface HappyHourConfig {
  enabled: boolean;
  days: string[];
  startTime: string;
  endTime: string;
}

interface HappyHourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig?: HappyHourConfig | null;
  onSuccess?: (config: HappyHourConfig) => void;
}

const ALL_DAYS = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

export function HappyHourDialog({
  open,
  onOpenChange,
  initialConfig,
  onSuccess,
}: HappyHourDialogProps) {
  const [enabled, setEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['qua', 'qui', 'sex']);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('20:00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setEnabled(Boolean(initialConfig.enabled));
      setSelectedDays(
        Array.isArray(initialConfig.days) && initialConfig.days.length > 0
          ? initialConfig.days
          : ['qua', 'qui', 'sex'],
      );
      setStartTime(initialConfig.startTime || '17:00');
      setEndTime(initialConfig.endTime || '20:00');
    }
  }, [initialConfig, open]);

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (enabled && selectedDays.length === 0) {
      setErrorMessage('Selecione ao menos um dia da semana para o Happy Hour.');
      return;
    }

    if (enabled && (!startTime || !endTime)) {
      setErrorMessage('Informe o horário de início e término.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await saveHappyHourSettingsAction({
        happyHourEnabled: enabled,
        happyHourDays: selectedDays,
        happyHourStartTime: startTime,
        happyHourEndTime: endTime,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Erro ao salvar configurações.');
        return;
      }

      setSuccessMessage('Configurações salvas!');
      const newConfig: HappyHourConfig = {
        enabled,
        days: selectedDays,
        startTime,
        endTime,
      };

      onSuccess?.(newConfig);

      setTimeout(() => {
        setSuccessMessage(null);
        onOpenChange(false);
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-zinc-200">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2 text-zinc-900">
            <Clock className="size-5 text-amber-500" />
            <DialogTitle className="text-lg font-bold tracking-tight">
              Horário de Happy Hour
            </DialogTitle>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Configure os dias e o horário em que o preço de Happy Hour será aplicado automaticamente nas mesas do restaurante.
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 pt-3">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div>
              <span className="text-xs font-bold text-zinc-900 block">
                Ativar Happy Hour
              </span>
              <span className="text-[11px] text-zinc-500">
                {enabled
                  ? 'Preços promocionais vigentes no horário'
                  : 'Desativado: preços regulares vigentes'}
              </span>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label="Ativar Happy Hour"
            />
          </div>

          {/* Dias da Semana */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-900 block">
              Dias de Happy Hour
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => toggleDay(day.id)}
                    className={`h-10 rounded-xl text-xs font-semibold transition-all flex items-center justify-center ${
                      !enabled
                        ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400'
                        : isSelected
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horários de Início e Fim */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="hh-start-time" className="text-xs font-semibold text-zinc-900 block">
                Início
              </label>
              <Input
                id="hh-start-time"
                type="time"
                disabled={!enabled}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 text-xs text-center font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="hh-end-time" className="text-xs font-semibold text-zinc-900 block">
                Término
              </label>
              <Input
                id="hh-end-time"
                type="time"
                disabled={!enabled}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 text-xs text-center font-medium"
              />
            </div>
          </div>

          {/* Context Note */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-900 leading-relaxed">
            Durante o período ativo, os produtos que possuem preço de Happy Hour serão destacados com o desconto e reunidos em uma categoria exclusiva no cardápio do cliente.
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-1.5">
              <Check className="size-4" />
              <span>{successMessage}</span>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-10 text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white min-w-24"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Salvando...</span>
                </>
              ) : (
                'Salvar Horário'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
