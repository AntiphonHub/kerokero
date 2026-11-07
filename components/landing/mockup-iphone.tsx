import React from 'react';
import Image from 'next/image';
import {
  Wifi,
  Battery,
  Signal,
  User,
  Search,
  Bell,
  Plus,
  ShoppingBag,
  ChevronRight,
  UtensilsCrossed,
  Receipt,
} from 'lucide-react';

export function MockupIPhone() {
  return (
    <div className="w-[310px] sm:w-[335px] rounded-[52px] bg-neutral-950 p-3 shadow-2xl shadow-black/90 border-4 border-neutral-700/80 ring-1 ring-white/10 relative text-left">
      {/* Botões laterais simulados no chassis */}
      <div className="absolute -left-[7px] top-24 w-[3px] h-9 bg-neutral-600 rounded-l-sm" />
      <div className="absolute -left-[7px] top-36 w-[3px] h-12 bg-neutral-600 rounded-l-sm" />
      <div className="absolute -left-[7px] top-52 w-[3px] h-12 bg-neutral-600 rounded-l-sm" />
      <div className="absolute -right-[7px] top-32 w-[3px] h-16 bg-neutral-600 rounded-r-sm" />

      {/* Tela do iPhone - 1:1 com o PWA do Cliente em app/m/[token] */}
      <div className="rounded-[42px] bg-zinc-50 overflow-hidden text-zinc-900 flex flex-col h-[640px] border border-zinc-200 relative select-none shadow-inner">
        {/* iOS Top Bar com Dynamic Island */}
        <div className="pt-2.5 px-6 pb-1 flex items-center justify-between text-zinc-800 text-[11px] font-semibold bg-white border-b border-zinc-100 z-30">
          <span>19:42</span>
          {/* Dynamic Island */}
          <div className="w-20 h-4 bg-black rounded-full flex items-center justify-end px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-zinc-700">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* 1:1 PwaShell Header (components/client/pwa-shell.tsx) */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="min-w-0 flex flex-col justify-center">
              <span className="truncate text-[10px] font-medium tracking-wide uppercase text-zinc-500">
                Bempedi Burger & Tap
              </span>
              <span className="truncate text-sm font-semibold text-zinc-900">
                Mesa 08
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 border border-zinc-200/60 px-3 py-1 text-xs font-medium text-zinc-800">
              <User className="size-3.5 text-zinc-500 shrink-0" />
              <span className="max-w-[100px] truncate">Carlos</span>
            </div>
          </div>
        </header>

        {/* 1:1 Search Bar & Waiter Bell (components/client/menu-view.tsx) */}
        <div className="p-3 bg-white border-b border-zinc-200/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Search className="size-3.5" />
              </div>
              <div className="w-full h-10 pl-8 pr-3 text-[11px] rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400 flex items-center">
                Buscar pratos, bebidas...
              </div>
            </div>

            {/* Waiter Bell (1:1 with components/client/service-buttons.tsx) */}
            <div className="size-10 rounded-full border border-zinc-200/90 bg-white text-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="size-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* 1:1 Horizontal Category Carousel (components/client/menu-view.tsx) */}
        <div className="bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-3 py-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="min-h-[32px] px-3 rounded-xl text-[11px] font-semibold bg-zinc-900 text-white shadow-xs shrink-0 flex items-center">
              Todos (24)
            </span>
            <span className="min-h-[32px] px-3 rounded-xl text-[11px] font-semibold bg-zinc-100 text-zinc-600 shrink-0 flex items-center">
              Burgers (8)
            </span>
            <span className="min-h-[32px] px-3 rounded-xl text-[11px] font-semibold bg-zinc-100 text-zinc-600 shrink-0 flex items-center">
              Porções (6)
            </span>
            <span className="min-h-[32px] px-3 rounded-xl text-[11px] font-semibold bg-zinc-100 text-zinc-600 shrink-0 flex items-center">
              Bebidas (10)
            </span>
          </div>
        </div>

        {/* 1:1 Products List (components/client/menu-view.tsx) */}
        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
          {/* Card 1: Smash Bacon Especial */}
          <div className="w-full text-left p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex gap-3">
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 tracking-tight leading-snug">
                  Smash Bacon Especial
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                  Blend 160g, cheddar inglês, bacon crocante e maionese defumada artesanal.
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">
                  R$ 38,00
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between shrink-0">
              <div className="relative size-16 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                <Image
                  src="/images/food-burger.png"
                  alt="Smash Bacon"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="size-7 mt-1.5 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs">
                <Plus className="size-3.5" />
              </div>
            </div>
          </div>

          {/* Card 2: Batata Rústica Alecrim */}
          <div className="w-full text-left p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs flex gap-3">
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 tracking-tight leading-snug">
                  Batata Rústica Alecrim
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                  Batatas crocantes com flor de sal e páprica defumada especial.
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">
                  R$ 24,00
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between shrink-0">
              <div className="relative size-16 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200/60">
                <Image
                  src="/images/food-marmita.png"
                  alt="Batata Rústica"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="size-7 mt-1.5 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs">
                <Plus className="size-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 1:1 Floating Cart Bottom Bar (components/client/cart-bottom-bar.tsx) */}
        <div className="px-3 pb-2 pt-1 bg-gradient-to-t from-zinc-100 to-transparent shrink-0">
          <div className="w-full min-h-[50px] bg-zinc-900 text-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShoppingBag className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                  2 itens no pedido
                </span>
                <span className="text-xs font-bold text-white tracking-tight">
                  R$ 62,00
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-white/5 rounded-xl px-2.5 py-1.5 border border-white/10">
              <span>Ver Comanda</span>
              <ChevronRight className="size-3.5" />
            </div>
          </div>
        </div>

        {/* 1:1 Fixed Bottom Navigation: Cardápio vs Comanda (components/client/client-app.tsx) */}
        <nav
          aria-label="Navegação da mesa"
          className="bg-white/95 backdrop-blur-md border-t border-zinc-200/80 shrink-0"
        >
          <div className="flex items-center justify-around h-14 px-4">
            {/* Aba Cardápio (Ativa) */}
            <div className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-950 font-bold">
              <UtensilsCrossed className="size-4 mb-0.5 stroke-[2.5]" />
              <span className="text-[10px] tracking-tight">Cardápio</span>
            </div>

            {/* Divisor */}
            <div className="h-5 w-px bg-zinc-200/80" />

            {/* Aba Comanda */}
            <div className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-400 font-medium">
              <div className="relative">
                <Receipt className="size-4 mb-0.5" />
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-extrabold flex items-center justify-center shadow-2xs">
                  2
                </span>
              </div>
              <span className="text-[10px] tracking-tight">Comanda</span>
            </div>
          </div>

          {/* iOS Home Indicator */}
          <div className="w-24 h-1 bg-zinc-300 rounded-full mx-auto mb-1.5" />
        </nav>
      </div>
    </div>
  );
}
