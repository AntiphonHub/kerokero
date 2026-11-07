'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { FINAL_CTA_DATA, getFinalCtaAction } from '@/lib/landing/cta-data';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FinalCtaSectionProps {
  hasSession?: boolean;
}

export function FinalCtaSection({ hasSession = false }: FinalCtaSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryAction = getFinalCtaAction(hasSession);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-900/60 p-8 sm:p-14 lg:p-16 text-center backdrop-blur-xl shadow-2xl"
      >
        {/* Glow de fundo sutil âmbar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full"
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            {FINAL_CTA_DATA.headline}
          </h2>

          <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed max-w-2xl mx-auto">
            {FINAL_CTA_DATA.subheadline}
          </p>

          {/* Botões de Ação */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto"
            >
              <Link
                href={primaryAction.href}
                className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-colors shadow-lg shadow-amber-500/20"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {!hasSession && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href={FINAL_CTA_DATA.secondaryButton.href}
                  className="flex items-center justify-center w-full sm:w-auto px-7 py-4 rounded-xl border border-neutral-700/80 bg-neutral-800/40 hover:bg-neutral-800 hover:border-neutral-600 text-neutral-200 font-medium text-base transition-colors"
                >
                  {FINAL_CTA_DATA.secondaryButton.label}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
