'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ImageIcon } from 'lucide-react';
import type { BentoFeature } from '@/lib/landing/features-data';

interface BentoCardProps {
  feature: BentoFeature;
  className?: string;
}

export function BentoCard({ feature, className = '' }: BentoCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`bento-card relative rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-lg shadow-black/40 overflow-hidden flex flex-col md:flex-row justify-between group transition-colors duration-300 hover:border-neutral-700 min-h-[190px] sm:min-h-[210px] md:h-[220px] lg:h-[230px] ${className}`}
    >
      {/* 1. Container de Informações (Esquerda) */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center z-10 relative">
        {/* Título de Alto Impacto */}
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
          {feature.title}
        </h3>

        {/* Descrição Concisa */}
        <p className="text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed font-normal line-clamp-3">
          {feature.description}
        </p>
      </div>

      {/* 2. Container da Imagem com efeito esmaecido (Metade fundida no background do card) */}
      <div className="relative w-full md:w-5/12 min-h-[140px] md:h-full flex items-center justify-center overflow-hidden bg-neutral-950/60 shrink-0">
        {!imageError ? (
          <div className="relative w-full h-full min-h-[140px]">
            <Image
              src={feature.imageSlot.src}
              alt={feature.imageSlot.alt}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          /* Placeholder neutro e discreto para imagem futura */
          <div className="w-full h-full min-h-[140px] p-4 flex flex-col items-center justify-center text-center border border-dashed border-neutral-800/80 rounded-xl m-3 bg-neutral-900/40">
            <div className="w-8 h-8 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 mb-1.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-semibold text-neutral-300">
              {feature.imageSlot.placeholderLabel || 'Espaço da Imagem'}
            </p>
            <span className="text-[9px] text-neutral-500 mt-0.5 font-mono truncate max-w-[140px]">
              {feature.imageSlot.src}
            </span>
          </div>
        )}

        {/* Efeito Esmaecido: Degradê que funde metade da imagem na cor de fundo do card (#171717 / neutral-900) */}
        {/* No Desktop: esmaece da esquerda para a direita */}
        <div className="hidden md:block absolute inset-0 pointer-events-none bg-gradient-to-r from-neutral-900 via-neutral-900/60 to-transparent" />
        {/* No Mobile: esmaece de cima para baixo */}
        <div className="block md:hidden absolute inset-0 pointer-events-none bg-gradient-to-b from-neutral-900 via-neutral-900/60 to-transparent" />
      </div>
    </motion.div>
  );
}
