'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { PRICING_DATA } from '@/lib/landing/pricing-data';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface PricingSectionProps {
  hasSession?: boolean;
}

export function PricingSection({ hasSession = false }: PricingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const ctaLabel = hasSession ? PRICING_DATA.cta.authLabel : PRICING_DATA.cta.label;
  const ctaHref = hasSession ? PRICING_DATA.cta.authHref : PRICING_DATA.cta.href;

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="preco"
      ref={sectionRef}
      className="relative z-10 py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center"
    >
      {/* Cabeçalho da Seção */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          {PRICING_DATA.title}
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed font-normal max-w-2xl mx-auto">
          {PRICING_DATA.description}
        </p>
      </div>

      {/* Card Único de Preço (Mensalidade Única) */}
      <motion.div
        ref={cardRef}
        whileHover={{ y: -4, transition: { duration: 0.25 } }}
        className="max-w-2xl mx-auto rounded-3xl bg-neutral-900/95 border border-neutral-800 shadow-2xl shadow-black/70 p-6 sm:p-10 relative overflow-hidden text-left"
      >
        {/* Efeito Glow Sutil no Topo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Topo do Card: Valor e Periodicidade */}
        <div className="text-center pb-8 border-b border-neutral-800/80 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Acesso Total à Plataforma
          </span>

          <div className="flex items-baseline justify-center gap-1.5 mt-3">
            <span className="text-2xl font-bold text-neutral-300">R$</span>
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
              {PRICING_DATA.amount}
            </span>
            <span className="text-base font-semibold text-neutral-400">
              {PRICING_DATA.period}
            </span>
          </div>

          <p className="text-xs text-neutral-400 mt-2 font-normal">
            {PRICING_DATA.billingNote}
          </p>
        </div>

        {/* Lista de Recursos Inclusos */}
        <div className="py-8 space-y-3.5 relative z-10">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-4">
            Tudo o que está incluso:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRICING_DATA.includedFeatures.map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-xs text-neutral-300">
                <div className="w-4 h-4 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Principal */}
        <div className="pt-2 relative z-10">
          <Link
            href={ctaHref}
            className="w-full py-4 rounded-xl text-base font-bold bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <p className="text-center text-[11px] text-neutral-500 mt-3">
            Setup em menos de 10 minutos • Pagamento seguro via PIX
          </p>
        </div>
      </motion.div>
    </section>
  );
}
