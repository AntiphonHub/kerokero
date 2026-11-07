import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HERO_CONTENT, getHeroCta } from '@/lib/landing/hero-data';
import { MockupMac } from './mockup-mac';
import { MockupIPhone } from './mockup-iphone';

interface HeroSectionProps {
  hasSession: boolean;
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  const cta = getHeroCta(hasSession);

  return (
    <section className="relative w-full pt-10 sm:pt-14 lg:pt-16 px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
      {/* Background Hero Image - Fit exato na tela inteira (100dvh) */}
      <div className="absolute top-0 left-0 right-0 h-[100dvh] z-0 select-none pointer-events-none overflow-hidden">
        <Image
          src="/images/background_hero.png"
          alt="Background Hero"
          fill
          priority
          className="object-cover object-top"
        />
        {/* Transição suave na base dos 100dvh onde o mockup cruza para a rolagem */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
      </div>

      {/* Conteúdo Superior: Logo, Headline, Subheadline e CTA */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center shrink-0">
        {/* 1. Logo na versão branca */}
        <div className="mb-4 sm:mb-5">
          <Image
            src="/images/logo_white.png"
            alt="Bempedi"
            width={180}
            height={65}
            priority
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* 3. Texto com promessa e chamada com respiro equilibrado */}
        <div className="space-y-2.5 sm:space-y-3 max-w-3xl mb-5 sm:mb-6">
          <h1 className="text-3xl sm:text-5xl lg:text-[44px] font-extrabold text-white tracking-tight leading-[1.14] drop-shadow-sm">
            {HERO_CONTENT.headline}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed font-normal max-w-2xl mx-auto drop-shadow-xs">
            {HERO_CONTENT.subheadline}
          </p>
        </div>

        {/* 3. CTA */}
        <div className="flex items-center gap-3.5">
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center gap-2.5 px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{cta.label}</span>
            <ArrowRight className="w-4 h-4 text-amber-600" />
          </Link>
          <Link
            href="#demonstracao"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-white hover:text-white bg-black/40 hover:bg-black/60 border border-white/20 transition-all backdrop-blur-md"
          >
            <span>{HERO_CONTENT.secondaryCta.label}</span>
          </Link>
        </div>
      </div>

      {/* 4. Mockups: Subidos para revelar mais conteúdo na 1ª tela sem apertar */}
      <div
        id="demonstracao"
        className="relative z-10 w-full max-w-5xl mx-auto mt-6 sm:mt-8 lg:mt-9"
      >
        {/* Mockup do Mac na Base */}
        <div className="relative z-10 drop-shadow-2xl">
          <MockupMac />
        </div>

        {/* Mockup do iPhone Sobreposto em Primeiro Plano */}
        <div className="absolute -right-2 sm:right-2 lg:right-6 top-8 sm:top-12 z-20 transform scale-[0.80] sm:scale-92 lg:scale-100 origin-top-right drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]">
          <MockupIPhone />
        </div>
      </div>
    </section>
  );
}
