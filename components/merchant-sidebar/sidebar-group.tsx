'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isRouteActive } from '@/lib/utils/sidebar';
import { SidebarItem, AnimatedIconHandle } from './sidebar-item';

export interface SidebarGroupItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; ref?: React.Ref<AnimatedIconHandle> }>;
}

interface SidebarGroupProps {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; ref?: React.Ref<AnimatedIconHandle> }>;
  items: SidebarGroupItemConfig[];
  pathname: string;
  isCollapsed: boolean;
  defaultOpen?: boolean;
}

export function SidebarGroup({
  label,
  icon: GroupIcon,
  items,
  pathname,
  isCollapsed,
  defaultOpen = false,
}: SidebarGroupProps) {
  const hasActiveItem = items.some((item) => isRouteActive(pathname, item.href));
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const iconRef = useRef<AnimatedIconHandle>(null);

  // Deriva o estado de exibição sem precisar de useEffect
  const isOpen = userToggled !== null ? userToggled : (hasActiveItem || defaultOpen);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation();
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Separador fino no modo compacto */}
        <div className="w-8 h-px bg-zinc-200/70 my-1" />
        {items.map((item) => {
          const active = isRouteActive(pathname, item.href);
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={active}
              isCollapsed={true}
              subContent={label}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Botão de cabeçalho do grupo: Hover em cinza claro e animação disparada no hover do container */}
      <button
        type="button"
        onClick={() => setUserToggled((prev) => (prev !== null ? !prev : !isOpen))}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex items-center justify-between w-full h-10 px-3 rounded-xl text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-zinc-900 transition-colors">
            <GroupIcon size={20} ref={iconRef} />
          </div>
          <span className="truncate tracking-[-0.01em]">{label}</span>
        </div>

        {/* Chevron Animado no lado direito */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-400 group-hover:text-zinc-600 shrink-0 ml-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Lista de itens do grupo com recuo na esquerda */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`group-${label}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden flex flex-col gap-1 ml-4 pl-3.5 border-l border-zinc-200/80 my-1"
          >
            {items.map((item) => {
              const active = isRouteActive(pathname, item.href);
              return (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={active}
                  isCollapsed={false}
                  isSubItem={true}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
