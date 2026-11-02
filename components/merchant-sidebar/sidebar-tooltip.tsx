'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarTooltipProps {
  content: string;
  subContent?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function SidebarTooltip({
  content,
  subContent,
  disabled = false,
  children,
}: SidebarTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 flex items-center"
          >
            {/* Seta indicadora */}
            <div className="border-y-[5px] border-y-transparent border-r-[6px] border-r-zinc-900 drop-shadow-xs" />

            {/* Container do tooltip */}
            <div className="flex items-center whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-xl shadow-zinc-900/15 border border-zinc-800">
              <span>{content}</span>
              {subContent && (
                <span className="ml-1.5 border-l border-zinc-700 pl-1.5 text-[11px] text-zinc-400 font-mono">
                  {subContent}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
