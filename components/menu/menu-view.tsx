'use client';

import React, { useState, useMemo } from 'react';
import { ProductDocument, CategoryDocument } from '@/lib/appwrite/products';
import { MenuToolbar } from './menu-toolbar';
import { ProductCard } from './product-card';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import {
  toggleProductStatusAction,
  deleteProductAction,
} from '@/actions/products';
import { UtensilsCrossed, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface MenuViewProps {
  initialProducts: ProductDocument[];
  initialCategories: CategoryDocument[];
}

export function MenuView({ initialProducts, initialCategories }: MenuViewProps) {
  const [products, setProducts] = useState<ProductDocument[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryDocument[]>(initialCategories);

  // Filters & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductDocument | null>(null);

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState<ProductDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling IDs state
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  // Actions
  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (prod: ProductDocument) => {
    setProductToEdit(prod);
    setIsDialogOpen(true);
  };

  const handleProductSaved = (saved: ProductDocument) => {
    setProducts((prev) => {
      const index = prev.findIndex((p) => p.$id === saved.$id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    // Se criou uma nova categoria, adiciona à lista local se não existir
    setCategories((prev) => {
      if (!prev.some((c) => c.$id === saved.categoryId)) {
        return [
          ...prev,
          {
            $id: saved.categoryId,
            name: saved.categoryName,
            establishmentId: saved.establishmentId,
          } as CategoryDocument,
        ];
      }
      return prev;
    });
  };

  const handleToggleStatus = async (product: ProductDocument) => {
    setTogglingIds((prev) => [...prev, product.$id]);
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.$id === product.$id ? { ...p, isActive: !p.isActive } : p)),
    );

    try {
      const res = await toggleProductStatusAction(product.$id);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.$id === product.$id ? res.product! : p)),
        );
      } else {
        // Rollback
        setProducts((prev) =>
          prev.map((p) => (p.$id === product.$id ? product : p)),
        );
      }
    } catch {
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.$id === product.$id ? product : p)),
      );
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== product.$id));
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteProductAction(productToDelete.$id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.$id !== productToDelete.$id));
        setProductToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Cardápio */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
          Cardápio & Produtos
        </h1>
        <p className="text-xs text-zinc-500">
          Gerencie o menu do seu restaurante, preços normais e de happy hour, adicionais e sugestões de upsell.
        </p>
      </div>

      {/* Toolbar com Filtros e Tab Switch */}
      <MenuToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewProduct={handleOpenCreate}
      />

      {/* Conteúdo Principal */}
      {products.length === 0 ? (
        /* Empty State: Nenhum produto cadastrado na loja */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white border border-dashed border-zinc-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-600">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 mb-1">
            Seu cardápio ainda está vazio
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mb-5 leading-relaxed">
            Cadastre os produtos, porções, pratos e bebidas servidos no seu estabelecimento para disponibilizar nas mesas.
          </p>
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-5 h-9 gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Produto
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* Empty State: Filtros não retornaram resultados */
        <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-white border border-zinc-200/80">
          <p className="text-sm font-medium text-zinc-800 mb-1">
            Nenhum produto corresponde aos filtros
          </p>
          <p className="text-xs text-zinc-500 mb-4">
            Tente buscar por outro termo ou limpe os filtros de categoria e status.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setStatusFilter('all');
            }}
            className="rounded-full text-xs font-medium"
          >
            Limpar Filtros
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visualização em Grade */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.$id}
              product={prod}
              onEdit={handleOpenEdit}
              onDelete={(p) => setProductToDelete(p)}
              onToggleStatus={handleToggleStatus}
              isToggling={togglingIds.includes(prod.$id)}
            />
          ))}
        </div>
      ) : (
        /* Visualização em Tabela */
        <ProductTable
          products={filteredProducts}
          onEdit={handleOpenEdit}
          onDelete={(p) => setProductToDelete(p)}
          onToggleStatus={handleToggleStatus}
          togglingIds={togglingIds}
        />
      )}

      {/* Modal de Cadastro / Edição */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productToEdit={productToEdit}
        categories={categories}
        allProducts={products}
        onSuccess={handleProductSaved}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="max-w-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-zinc-900">
                Excluir produto
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Esta ação removerá o produto permanentemente do cardápio.
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200/60 my-2">
            Tem certeza que deseja remover o produto{' '}
            <strong className="text-zinc-900">&quot;{productToDelete?.name}&quot;</strong>?
          </p>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setProductToDelete(null)}
              className="rounded-full text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="rounded-full text-xs font-medium gap-1.5"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
