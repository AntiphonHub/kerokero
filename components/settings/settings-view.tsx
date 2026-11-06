'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SettingsNav, type SettingsTabId } from './settings-nav';
import { StoreTab } from './store-tab';
import { TablesTab } from './tables-tab';
import { SecurityTab } from './security-tab';
import { SubscriptionTab } from './subscription-tab';
import { DangerTab } from './danger-tab';
import type { EstablishmentDocument } from '@/lib/appwrite/establishments';

interface SettingsViewProps {
  establishment: EstablishmentDocument;
  initialTab?: SettingsTabId;
}

export function SettingsView({ establishment, initialTab = 'store' }: SettingsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromQuery = (searchParams.get('tab') as SettingsTabId) || initialTab;
  const [activeTab, setActiveTab] = useState<SettingsTabId>(tabFromQuery);

  const handleTabChange = (tab: SettingsTabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'store') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Configurações</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Gerencie parâmetros cadastrais da sua loja, capacidade do salão, credenciais e plano SaaS.
        </p>
      </div>

      {/* Navegação de Abas */}
      <SettingsNav currentTab={activeTab} onTabChange={handleTabChange} />

      {/* Conteúdo da Aba Ativa */}
      <div className="pt-2">
        {activeTab === 'store' && <StoreTab establishment={establishment} />}
        {activeTab === 'tables' && <TablesTab establishment={establishment} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'subscription' && <SubscriptionTab establishment={establishment} />}
        {activeTab === 'danger' && <DangerTab establishment={establishment} />}
      </div>
    </div>
  );
}
