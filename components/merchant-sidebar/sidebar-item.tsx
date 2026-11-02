'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SidebarTooltip } from './sidebar-tooltip';

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; ref?: React.Ref<AnimatedIconHandle> }>;
  isActive: boolean;
  isCollapsed: boolean;
  subContent?: string;
  isSubItem?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  subContent,
  isSubItem = false,
  onClick,
}: SidebarItemProps) {
  const iconRef = useRef<AnimatedIconHandle>(null);

  const handleMouseEnter = () => {
    iconRef.current?.startAnimation();
  };

  const handleMouseLeave = () => {
    iconRef.current?.stopAnimation();
  };

  const itemContent = (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative flex items-center transition-all duration-200 select-none cursor-pointer',
        isCollapsed
          ? 'h-10 w-10 justify-center rounded-xl mx-auto'
          : isSubItem
            ? 'w-full h-9 px-2.5 rounded-lg text-[13px] font-medium'
            : 'w-full h-10 px-3 rounded-xl text-sm font-medium',
        isActive
          ? 'bg-zinc-100 text-zinc-900 font-semibold'
          : isSubItem
            ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
      )}
    >
      {/* Indicador de barra ativa lateral quando expandido */}
      {isActive && !isCollapsed && (
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-1 bg-amber-500 rounded-full pointer-events-none',
            isSubItem ? 'left-1 h-3.5' : 'left-1.5 h-4'
          )}
        />
      )}

      {/* Conteúdo alinhado: Container de Ícone + Texto com gap padronizado */}
      <div
        className={cn(
          'flex items-center min-w-0 flex-1',
          isCollapsed ? 'justify-center' : isSubItem ? 'gap-2.5' : 'gap-3'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center shrink-0 transition-colors',
            isSubItem ? 'w-4 h-4' : 'w-5 h-5',
            isActive
              ? 'text-amber-500'
              : 'text-zinc-500 group-hover:text-zinc-900'
          )}
        >
          <Icon size={isSubItem ? 18 : 20} ref={iconRef} />
        </div>

        {!isCollapsed && (
          <span className="truncate tracking-[-0.01em]">
            {label}
          </span>
        )}
      </div>
    </Link>
  );

  if (isCollapsed) {
    return (
      <SidebarTooltip content={label} subContent={subContent} disabled={!isCollapsed}>
        {itemContent}
      </SidebarTooltip>
    );
  }

  return itemContent;
}
