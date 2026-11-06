'use client';

import { useState, useTransition } from 'react';
import { updateStoreSettingsAction } from '@/actions/settings';
import { Store, Clock, Phone, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface StoreTabProps {
  establishment: EstablishmentDocument;
}

const WEEK_DAYS = [
  { id: 'dom', label: 'Dom' },
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
];

export function StoreTab({ establishment }: StoreTabProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Parse days from JSON if string
  const parseDays = (raw?: string | string[]): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const [name, setName] = useState(establishment.name || '');
  const [phone, setPhone] = useState(establishment.phone || '');
  const [address, setAddress] = useState(establishment.address || '');
  const [openingDays, setOpeningDays] = useState<string[]>(parseDays(establishment.openingDays));
  const [openingTime, setOpeningTime] = useState(establishment.openingTime || '11:00');
  const [closingTime, setClosingTime] = useState(establishment.closingTime || '23:00');

  const [happyHourEnabled, setHappyHourEnabled] = useState(Boolean(establishment.happyHourEnabled));
  const [happyHourStartTime, setHappyHourStartTime] = useState(establishment.happyHourStartTime || '17:00');
  const [happyHourEndTime, setHappyHourEndTime] = useState(establishment.happyHourEndTime || '20:00');
  const [happyHourDays, setHappyHourDays] = useState<string[]>(parseDays(establishment.happyHourDays));

  const toggleDay = (dayId: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(dayId)) {
      setter(current.filter((d) => d !== dayId));
    } else {
      setter([...current, dayId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateStoreSettingsAction({
        name,
        phone,
        address,
        openingDays,
        openingTime,
        closingTime,
        happyHourEnabled,
        happyHourStartTime: happyHourEnabled ? happyHourStartTime : undefined,
        happyHourEndTime: happyHourEnabled ? happyHourEndTime : undefined,
        happyHourDays: happyHourEnabled ? happyHourDays : undefined,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Configurações salvas com sucesso!' });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Erro ao atualizar dados da loja.' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Informações Básicas */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Store className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Identidade do Estabelecimento</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-zinc-700">Nome Fantasia do Restaurante / Bar</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bar do Urso"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Phone className="h-3 w-3 text-zinc-400" />
              <span>Telefone / WhatsApp de Contato</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <MapPin className="h-3 w-3 text-zinc-400" />
              <span>Endereço Completo</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua Augusta, 123 - Consolação, SP"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Horário de Funcionamento Regular */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Clock className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900">Horário de Funcionamento</h3>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-700 block">Dias em que o estabelecimento abre:</label>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((d) => {
              const active = openingDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id, openingDays, setOpeningDays)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-semibold'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Horário de Abertura</label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Horário de Encerramento</label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Happy Hour Promocional */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Happy Hour Automático</h3>
            <p className="text-xs text-zinc-500">Destaca promoções de bebidas e porções em horários estratégicos.</p>
          </div>
          <button
            type="button"
            onClick={() => setHappyHourEnabled(!happyHourEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              happyHourEnabled ? 'bg-amber-500' : 'bg-zinc-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                happyHourEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {happyHourEnabled && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 block">Dias de Happy Hour:</label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((d) => {
                  const active = happyHourDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id, happyHourDays, setHappyHourDays)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-semibold'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Início do Happy Hour</label>
                <input
                  type="time"
                  value={happyHourStartTime}
                  onChange={(e) => setHappyHourStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Término do Happy Hour</label>
                <input
                  type="time"
                  value={happyHourEndTime}
                  onChange={(e) => setHappyHourEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando alterações...</span>
            </>
          ) : (
            <span>Salvar Alterações</span>
          )}
        </button>
      </div>
    </form>
  );
}
