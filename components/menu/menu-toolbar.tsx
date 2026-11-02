'use client';

import React from 'react';
import { Search, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryDocument } from '@/lib/appwrite/products';
import { cn } from '@/lib/utils';

interface MenuToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: CategoryDocument[];
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onNewProduct: () => void;
}

export function MenuToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  onNewProduct,
}: MenuToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between py-2">
      {/* Busca e Filtros */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Input de Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="h-10 w-full rounded-xl border border-zinc-200/90 bg-white pl-10 pr-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Filtro por Categoria */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filtrar por Categoria"
          className="h-10 rounded-xl border border-zinc-200/90 bg-white px-3 text-xs text-zinc-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map((cat) => (
            <option key={cat.$id} value={cat.$id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Filtro por Status */}
        <div className="flex items-center rounded-xl border border-zinc-200/90 bg-white p-1">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
              statusFilter === 'all'
                ? 'bg-amber-500 text-white font-medium shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900',
            )}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('active')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
              statusFilter === 'active'
                ? 'bg-amber-500 text-white font-medium shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900',
            )}
          >
            Ativos
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('inactive')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
              statusFilter === 'inactive'
                ? 'bg-amber-500 text-white font-medium shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900',
            )}
          >
            Desativados
          </button>
        </div>
      </div>

      {/* Alternância de Visualização e Botão Novo Produto */}
      <div className="flex items-center gap-2.5 self-end lg:self-auto">
        {/* Tab Switch: Grade vs Tabela */}
        <div className="flex items-center rounded-xl border border-zinc-200/90 bg-white p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Visualização em Grade"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-800',
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            title="Visualização em Tabela"
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              viewMode === 'table'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-800',
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Botão Novo Produto */}
        <Button
          type="button"
          onClick={onNewProduct}
          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs h-10 px-4 gap-1.5 shadow-xs transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>
    </div>
  );
}
