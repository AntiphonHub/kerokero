import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FOOTER_DATA } from '@/lib/landing/cta-data';

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Bloco Superior: Logo, Links de Navegação e Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo / Marca */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo_white.png"
              alt="Bempedi"
              width={110}
              height={32}
              className="h-7 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Links de Navegação */}
          <nav aria-label="Navegação do rodapé" className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
            {FOOTER_DATA.navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-neutral-400 font-light text-center sm:text-right">
            {FOOTER_DATA.copyright}
          </p>
        </div>

        {/* Linha Divisória Sutil e Identificação Fiscal (Lei do E-commerce) */}
        <div className="mt-8 pt-6 border-t border-neutral-900/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-neutral-400 font-light text-center sm:text-left">
          <p>
            {FOOTER_DATA.brand} é operado por {FOOTER_DATA.companyName} · CNPJ: {FOOTER_DATA.cnpj}
          </p>
          <p>
            Contato:{' '}
            <a
              href={`mailto:${FOOTER_DATA.contactEmail}`}
              className="text-neutral-400 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
            >
              {FOOTER_DATA.contactEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
