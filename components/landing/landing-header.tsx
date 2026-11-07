'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  hasSession: boolean;
}

export function LandingHeader({ hasSession }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra o header suavemente após o usuário rolar 80px (saindo do topo do Hero)
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
        isScrolled
          ? 'opacity-100 translate-y-0 bg-neutral-950/85 backdrop-blur-xl border-b border-white/10 shadow-2xl pointer-events-auto'
          : 'opacity-0 -translate-y-4 pointer-events-none'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo Oficial */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Image
            src="/images/logo_white.png"
            alt="Bempedi"
            width={130}
            height={44}
            className="h-8 sm:h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          <Link
            href="#recursos"
            className="hover:text-white transition-colors"
          >
            Recursos
          </Link>
          <Link
            href="#demonstracao"
            className="hover:text-white transition-colors"
          >
            Demonstração
          </Link>
          <Link
            href="#preco"
            className="hover:text-white transition-colors"
          >
            Preço
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {hasSession ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all"
              >
                <span>Criar Conta</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
