'use client';

import { Store, LayoutGrid, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';

export type SettingsTabId = 'store' | 'tables' | 'security' | 'subscription' | 'danger';

interface SettingsNavProps {
  currentTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

const tabs: Array<{
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isDanger?: boolean;
}> = [
  { id: 'store', label: 'Geral da Loja', icon: Store },
  { id: 'tables', label: 'Mesas & Salão', icon: LayoutGrid },
  { id: 'security', label: 'Segurança & Perfil', icon: ShieldCheck },
  { id: 'subscription', label: 'Plano & Assinatura', icon: CreditCard },
  { id: 'danger', label: 'Zona de Perigo', icon: AlertTriangle, isDanger: true },
];

export function SettingsNav({ currentTab, onTabChange }: SettingsNavProps) {
  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 ${
              isActive
                ? tab.isDanger
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-amber-500 text-white shadow-xs'
                : tab.isDanger
                ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
