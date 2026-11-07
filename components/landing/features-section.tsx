'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { BENTO_FEATURES, FEATURES_HEADER } from '@/lib/landing/features-data';
import { BentoCard } from './bento-card';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Animação de Scroll do Cabeçalho da Seção com GSAP
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      }

      // 2. Animação de Scroll dos Cards do Bento Grid com Stagger via GSAP
      const cards = sectionRef.current?.querySelectorAll('.bento-card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="recursos"
      ref={sectionRef}
      className="relative z-10 min-h-screen flex flex-col justify-center pt-36 sm:pt-48 lg:pt-56 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      {/* Cabeçalho da Seção */}
      <div
        ref={headerRef}
        className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-2.5"
      >
        <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.16]">
          {FEATURES_HEADER.title}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal max-w-2xl mx-auto">
          {FEATURES_HEADER.description}
        </p>
      </div>

      {/* Bento Grid Layout Compacto (Cabe em 1 tela: 2 linhas 7+5 e 5+7) */}
      <motion.div
        className="grid grid-cols-12 gap-4 sm:gap-5"
        initial={{ opacity: 1 }}
      >
        {BENTO_FEATURES.map((feature) => (
          <BentoCard
            key={feature.id}
            feature={feature}
            className={feature.colSpan}
          />
        ))}
      </motion.div>
    </section>
  );
}
