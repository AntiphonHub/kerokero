import React from 'react';
import Image from 'next/image';
import {
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  LayoutGrid,
  Bell,
  PanelLeftClose,
  ChevronDown,
  Layers,
  ShoppingBag,
  CircleDollarSign,
  Settings,
  LogOut,
  ArrowRight,
  Check,
} from 'lucide-react';

export function MockupMac() {
  const topProducts = [
    { rank: 1, name: 'Smash Bacon Especial', revenue: 'R$ 1.824,00', qty: '48 un.', width: '100%', isTop: true },
    { rank: 2, name: 'Batata Rústica Alecrim', revenue: 'R$ 1.056,00', qty: '44 un.', width: '68%', isTop: false },
    { rank: 3, name: 'Chopp Artesanal IPA 500ml', revenue: 'R$ 864,00', qty: '48 un.', width: '52%', isTop: false },
    { rank: 4, name: 'Pizza Margherita Individual', revenue: 'R$ 680,00', qty: '20 un.', width: '42%', isTop: false },
    { rank: 5, name: 'Pudim de Leite Condensado', revenue: 'R$ 466,50', qty: '31 un.', width: '28%', isTop: false },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-neutral-900 shadow-2xl shadow-black/90 border border-neutral-700/60 overflow-hidden select-none text-left h-[540px] sm:h-[600px] lg:h-auto">
      {/* Mac Window Chrome Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e24] border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
          <span className="ml-3 text-xs font-mono text-neutral-400 hidden sm:inline-block">
            bempedi.com/dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-neutral-300">
            Bempedi Burger & Tap
          </span>
        </div>

        <div className="w-16" />
      </div>

      {/* Real App Container: bg-[#F4F4F5] (1:1 with app/(app)/layout.tsx) */}
      <div className="flex bg-[#F4F4F5] text-zinc-900 min-h-[540px] sm:min-h-[580px] h-full lg:h-auto">
        {/* Real App Floating Sidebar (1:1 with components/merchant-sidebar/sidebar.tsx) */}
        <aside className="w-60 bg-white border border-zinc-200/80 rounded-2xl shadow-xs my-3 ml-3 p-3 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            {/* Sidebar Header: Logo & Collapse Button */}
            <div className="flex items-center justify-between px-1 pb-3 border-b border-zinc-100">
              <Image
                src="/images/logo.png"
                alt="Bempedi"
                width={125}
                height={40}
                className="h-9 w-auto object-contain"
                priority
              />
              <div className="h-7 w-7 rounded-lg text-zinc-400 flex items-center justify-center">
                <PanelLeftClose className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1">
              {/* Item Principal Ativo: Dashboard */}
              <div className="group relative flex items-center w-full h-10 px-3 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-900">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-amber-500 rounded-full" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-zinc-900">
                    <Layers className="w-4 h-4 text-zinc-900" />
                  </div>
                  <span>Dashboard</span>
                </div>
              </div>

              {/* Grupo: Sua Loja */}
              <div className="pt-1">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-600 rounded-xl hover:bg-zinc-50">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-zinc-500" />
                    <span>Sua Loja</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="pl-6 space-y-0.5 mt-0.5">
                  <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                    <span>Mesas & Comandas</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                    <span>Cozinha (KDS)</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-2">
                    <span>Cardápio & Produtos</span>
                  </div>
                </div>
              </div>

              {/* Grupo: Financeiro */}
              <div className="pt-1">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-600 rounded-xl hover:bg-zinc-50">
                  <div className="flex items-center gap-2.5">
                    <CircleDollarSign className="w-4 h-4 text-zinc-500" />
                    <span>Financeiro</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </div>

              {/* Configurações */}
              <div className="pt-1">
                <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-700 rounded-xl hover:bg-zinc-50">
                  <Settings className="w-4 h-4 text-zinc-500" />
                  <span>Configurações</span>
                </div>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer (1:1 with components/merchant-sidebar/sidebar-footer.tsx) */}
          <div className="border-t border-zinc-100 pt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200/80 font-bold text-xs tracking-wider text-zinc-800 shadow-2xs">
                BP
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 truncate">
                  Bempedi Burger
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  20 mesas
                </p>
              </div>
            </div>
            <div className="p-1 text-zinc-400 hover:text-zinc-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
        </aside>

        {/* Real Main Workspace Content (1:1 with app/(app)/dashboard/page.tsx) */}
        <main className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col gap-5">
          {/* Cabeçalho com Saudação e Seletor de Período (1:1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                Olá, Lojista!
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Métricas operacionais e financeiras de Bempedi Burger & Tap.
              </p>
            </div>

            {/* PeriodSelector (1:1 with components/dashboard/period-selector.tsx) */}
            <div className="inline-flex items-center rounded-xl bg-zinc-200/70 p-1 border border-zinc-200 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white shadow-xs"
              >
                Hoje
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 hover:text-zinc-900"
              >
                Ontem
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 hover:text-zinc-900"
              >
                Últimos 7 dias
              </button>
            </div>
          </div>

          {/* Cards de Métricas Principais (1:1 with components/dashboard/metrics-cards.tsx) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Faturamento Bruto (Destaque Principal com tarja âmbar no topo) */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Faturamento Bruto
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
                R$ 4.890,50
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Vendas brutas em hoje
              </p>
            </div>

            {/* 2. Ticket Médio */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Ticket Médio
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50/60 text-amber-600 border border-amber-200/40">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
                R$ 84,20
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Por comanda atendida no período
              </p>
            </div>

            {/* 3. Comandas Atendidas */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Comandas Atendidas
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
                48
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                112 itens produzidos
              </p>
            </div>

            {/* 4. Ocupação do Salão */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Ocupação do Salão
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
                  14{' '}
                  <span className="text-sm font-normal text-zinc-400">/ 20 mesas</span>
                </p>
              </div>

              <div className="mt-2">
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: '70%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Gráficos em Duas Colunas (1:1 with SalesChart & TopProductsChart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1:1 SalesChart com Curva de Área e Tooltip Ativo */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-2">
                <h2 className="text-base font-semibold text-zinc-900">Vendas por Hora</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Distribuição horária do faturamento (Hoje)
                </p>
              </div>

              {/* Gráfico Vetorial de Área SVG com Gradiente Âmbar */}
              <div className="relative h-44 w-full pt-4">
                <svg className="w-full h-32 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="macSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity="0.28" />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Linhas horizontais de grade (CartesianGrid) */}
                  <line x1="0" y1="20" x2="400" y2="20" stroke="#E4E4E7" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#E4E4E7" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#E4E4E7" strokeDasharray="3 3" />

                  {/* Área preenchida */}
                  <path
                    d="M 0,110 Q 40,95 80,45 T 160,85 T 240,65 T 320,15 T 400,70 L 400,120 L 0,120 Z"
                    fill="url(#macSalesGradient)"
                  />

                  {/* Linha da curva âmbar */}
                  <path
                    d="M 0,110 Q 40,95 80,45 T 160,85 T 240,65 T 320,15 T 400,70"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Active Dot no pico das 20h */}
                  <circle cx="320" cy="15" r="4.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                </svg>

                {/* Tooltip idêntico a CustomTooltip de sales-chart.tsx */}
                <div className="absolute top-1 right-12 rounded-xl border border-amber-200/70 bg-white p-2.5 shadow-md text-left text-xs pointer-events-none">
                  <p className="font-semibold text-zinc-500 text-[10px]">20:00</p>
                  <p className="text-xs font-extrabold text-amber-600">R$ 1.890,50</p>
                  <p className="text-[10px] text-zinc-500">18 pedidos</p>
                </div>

                {/* XAxis Labels */}
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-100">
                  <span>11h</span>
                  <span>13h</span>
                  <span>15h</span>
                  <span>17h</span>
                  <span>19h</span>
                  <span className="font-bold text-amber-600">20h</span>
                  <span>22h</span>
                </div>
              </div>
            </div>

            {/* 1:1 TopProductsChart (Mais Vendidos por Faturamento) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3">
                <h2 className="text-base font-semibold text-zinc-900">
                  Mais Vendidos por Faturamento
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Top 5 itens que mais geraram receita no período
                </p>
              </div>

              <div className="space-y-2.5">
                {topProducts.map((item) => (
                  <div key={item.rank} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold ${
                            item.isTop
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className={`truncate ${item.isTop ? 'font-bold text-zinc-900' : 'font-medium text-zinc-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-bold text-zinc-900">
                          {item.revenue}
                        </span>
                        <span className="text-[11px] text-zinc-400 ml-1.5 font-normal">
                          ({item.qty})
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.isTop ? 'bg-amber-500' : 'bg-zinc-300'
                        }`}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 1:1 LiveServiceCalls (Chamados de Mesa ao Vivo) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-900">Mesa 08 • Carlos</h3>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
                    Chamado pendente
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">Solicitação: Gelo / Copo adicional (há 1 min)</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold shadow-xs">
              <Check className="w-3.5 h-3.5" />
              <span>Atendido</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
