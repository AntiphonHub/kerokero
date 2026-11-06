'use client';

import { useSyncExternalStore, useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { isRouteActive } from '@/lib/utils/sidebar';
import { Menu, X } from 'lucide-react';

// Ícones animados via @lucide-animated
import { LayoutPanelTopIcon } from '@/components/ui/layout-panel-top';
import { CartIcon } from '@/components/ui/cart';
import { FileTextIcon } from '@/components/ui/file-text';
import { CookingPotIcon } from '@/components/ui/cooking-pot';
import { BookTextIcon } from '@/components/ui/book-text';
import { CircleDollarSignIcon } from '@/components/ui/circle-dollar-sign';
import { WalletIcon } from '@/components/ui/wallet';
import { ReceiptIcon } from '@/components/ui/receipt';
import { ChartLineIcon } from '@/components/ui/chart-line';
import { SettingsIcon } from '@/components/ui/settings';
import { PanelLeftCloseIcon, PanelLeftCloseIconHandle } from '@/components/ui/panel-left-close';
import { PanelLeftOpenIcon, PanelLeftOpenIconHandle } from '@/components/ui/panel-left-open';

import { SidebarItem } from './sidebar-item';
import { SidebarGroup, SidebarGroupItemConfig } from './sidebar-group';
import { SidebarFooter } from './sidebar-footer';
import { SidebarTooltip } from './sidebar-tooltip';

interface MerchantSidebarProps {
  establishmentName?: string | null;
  tablesCount?: number | null;
  className?: string;
}

const STORAGE_KEY = 'kerokero_sidebar_collapsed';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('kerokero_sidebar_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('kerokero_sidebar_change', callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return false;
}

export function MerchantSidebar({
  establishmentName,
  tablesCount,
  className,
}: MerchantSidebarProps) {
  const pathname = usePathname() || '/dashboard';
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openIconRef = useRef<PanelLeftOpenIconHandle>(null);
  const closeIconRef = useRef<PanelLeftCloseIconHandle>(null);

  // Fecha o drawer mobile ao navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    const next = !isCollapsed;
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event('kerokero_sidebar_change'));
  };

  // Configuração dos itens do grupo "Sua Loja"
  const yourStoreItems: SidebarGroupItemConfig[] = [
    {
      href: '/tables',
      label: 'Mesas & Comandas',
      icon: FileTextIcon,
    },
    {
      href: '/kds',
      label: 'Cozinha (KDS)',
      icon: CookingPotIcon,
    },
    {
      href: '/menu',
      label: 'Cardápio & Produtos',
      icon: BookTextIcon,
    },
  ];

  // Configuração dos itens do grupo "Financeiro"
  const financialItems: SidebarGroupItemConfig[] = [
    {
      href: '/wallet',
      label: 'Carteira & Saque',
      icon: WalletIcon,
    },
    {
      href: '/orders',
      label: 'Histórico de Pedidos',
      icon: ReceiptIcon,
    },
    {
      href: '/analytics',
      label: 'Métricas & Vendas',
      icon: ChartLineIcon,
    },
  ];

  return (
    <>
      {/* Barra de Topo no Mobile com botão de Menu */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-zinc-200/80 sticky top-0 z-30 w-full shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="grid h-6 w-6 grid-cols-2 gap-[3px]">
            <div className="rounded-[2px] bg-zinc-900" />
            <div className="rounded-[2px] bg-amber-500" />
            <div className="rounded-[2px] bg-zinc-900" />
            <div className="rounded-[2px] bg-zinc-900" />
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900">kerokero</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Abrir menu"
          className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop no Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Principal (Drawer no Mobile, Flutuante e Fixa no Desktop) */}
      <aside
        data-testid="merchant-sidebar"
        aria-label="Menu Principal"
        className={cn(
          'flex flex-col bg-white border border-zinc-200/80 shadow-xs transition-all duration-300 ease-in-out',
          // Mobile Drawer: fixado na lateral da tela inteira
          'fixed inset-y-0 left-0 z-50 w-72 p-4 md:sticky md:top-3 md:self-start',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
          // Desktop: flutuante com margem e cantos arredondados
          'md:h-[calc(100vh-1.5rem)] md:my-3 md:ml-3 md:p-3 md:rounded-2xl md:z-30 md:shrink-0',
          isCollapsed ? 'md:w-[72px]' : 'md:w-64',
          className
        )}
      >
        {/* Header da Sidebar: Logo, Nome do App e Botão de Alternância */}
        <div
          className={cn(
            'flex items-center pb-3 mb-2 border-b border-zinc-100 transition-all',
            isCollapsed ? 'md:justify-center md:flex-col gap-3' : 'justify-between px-1'
          )}
        >
          {isCollapsed ? (
            <>
              {/* Ícone Geométrico Brand quando colapsado */}
              <Link
                href="/dashboard"
                className="hidden md:grid h-6 w-6 grid-cols-2 gap-[3px] p-0.5 hover:opacity-85 transition-opacity"
                aria-label="KeroKero Home"
              >
                <div className="rounded-[2px] bg-zinc-900" />
                <div className="rounded-[2px] bg-amber-500" />
                <div className="rounded-[2px] bg-zinc-900" />
                <div className="rounded-[2px] bg-zinc-900" />
              </Link>

              {/* Botão de Expandir com Tooltip no Desktop */}
              <div className="hidden md:block">
                <SidebarTooltip content="Expandir menu" disabled={!isCollapsed}>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    onMouseEnter={() => openIconRef.current?.startAnimation()}
                    onMouseLeave={() => openIconRef.current?.stopAnimation()}
                    aria-label="Expandir menu lateral"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <PanelLeftOpenIcon size={20} ref={openIconRef} />
                  </button>
                </SidebarTooltip>
              </div>

              {/* No mobile, mesmo colapsado no desktop, mostra a brand inteira + close */}
              <div className="flex md:hidden items-center justify-between w-full">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                  <div className="grid h-6 w-6 grid-cols-2 gap-[3px]">
                    <div className="rounded-[2px] bg-zinc-900" />
                    <div className="rounded-[2px] bg-amber-500" />
                    <div className="rounded-[2px] bg-zinc-900" />
                    <div className="rounded-[2px] bg-zinc-900" />
                  </div>
                  <span className="text-lg font-bold tracking-[-0.03em] text-zinc-900">
                    kerokero
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Fechar menu lateral"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Brand completa: Símbolo + Nome */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 no-underline group"
              >
                <div className="grid h-6 w-6 grid-cols-2 gap-[3px] transition-transform group-hover:scale-105">
                  <div className="rounded-[2px] bg-zinc-900" />
                  <div className="rounded-[2px] bg-amber-500" />
                  <div className="rounded-[2px] bg-zinc-900" />
                  <div className="rounded-[2px] bg-zinc-900" />
                </div>
                <span className="text-lg font-bold tracking-[-0.03em] text-zinc-900">
                  kerokero
                </span>
              </Link>

              {/* Botão de Recolher no Desktop */}
              <button
                type="button"
                onClick={toggleSidebar}
                onMouseEnter={() => closeIconRef.current?.startAnimation()}
                onMouseLeave={() => closeIconRef.current?.stopAnimation()}
                aria-label="Recolher menu lateral"
                className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <PanelLeftCloseIcon size={18} ref={closeIconRef} />
              </button>

              {/* Botão de Fechar no Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Fechar menu lateral"
                className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navegação Principal com espaçamento unificado */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-thin">
          {/* Item Principal: Dashboard */}
          <SidebarItem
            href="/dashboard"
            label="Dashboard"
            icon={LayoutPanelTopIcon}
            isActive={isRouteActive(pathname, '/dashboard')}
            isCollapsed={isCollapsed}
          />

          {/* Grupo 1: Sua Loja */}
          <SidebarGroup
            label="Sua Loja"
            icon={CartIcon}
            items={yourStoreItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />

          {/* Grupo 2: Financeiro */}
          <SidebarGroup
            label="Financeiro"
            icon={CircleDollarSignIcon}
            items={financialItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />

          {/* Item Fora dos Grupos: Configurações */}
          <SidebarItem
            href="/settings"
            label="Configurações"
            icon={SettingsIcon}
            isActive={isRouteActive(pathname, '/settings')}
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Rodapé da Sidebar: Iniciais + Nome do Estabelecimento + Mesas */}
        <SidebarFooter
          establishmentName={establishmentName}
          tablesCount={tablesCount}
          isCollapsed={isCollapsed}
        />
      </aside>
    </>
  );
}
