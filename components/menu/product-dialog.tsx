'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { ProductDocument, CategoryDocument } from '@/lib/appwrite/products';
import { ProductAddon, ProductInput } from '@/lib/schemas/product';
import {
  saveProductAction,
  createCategoryAction,
  uploadProductImageAction,
} from '@/actions/products';
import {
  formatCentsToBrl,
  parseBrlToCents,
  maskCurrencyInput,
} from '@/lib/formatters';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: ProductDocument | null;
  categories: CategoryDocument[];
  allProducts: ProductDocument[];
  onSuccess: (savedProduct: ProductDocument) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  productToEdit,
  categories: initialCategories,
  allProducts,
  onSuccess,
}: ProductDialogProps) {
  const [categories, setCategories] = useState<CategoryDocument[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [happyHourPriceStr, setHappyHourPriceStr] = useState('');
  const [stockQuantityStr, setStockQuantityStr] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Category combobox states
  const [categoryQuery, setCategoryQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Addons states
  const [addons, setAddons] = useState<Array<{ id: string; name: string; priceStr: string }>>([]);

  // Upsell states
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<string[]>([]);
  const [upsellMessage, setUpsellMessage] = useState('');
  const [isUpsellDropdownOpen, setIsUpsellDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Reset or populate form when opening
  useEffect(() => {
    if (open) {
      setErrorMsg(null);
      if (productToEdit) {
        setName(productToEdit.name);
        setDescription(productToEdit.description || '');
        setImageUrl(productToEdit.imageUrl || '');
        setImagePreview(productToEdit.imageUrl || '');
        setPriceStr(maskCurrencyInput(String(productToEdit.price)));
        setHappyHourPriceStr(
          productToEdit.happyHourPrice != null
            ? maskCurrencyInput(String(productToEdit.happyHourPrice))
            : '',
        );
        setStockQuantityStr(
          productToEdit.stockQuantity != null ? String(productToEdit.stockQuantity) : '',
        );
        setIsActive(productToEdit.isActive);
        setSelectedCategory({
          id: productToEdit.categoryId,
          name: productToEdit.categoryName,
        });
        setCategoryQuery(productToEdit.categoryName);
        setAddons(
          (productToEdit.addons || []).map((a) => ({
            id: a.id,
            name: a.name,
            priceStr: maskCurrencyInput(String(a.price)),
          })),
        );
        setSelectedUpsellIds(productToEdit.upsellProductIds || []);
        setUpsellMessage(productToEdit.upsellMessage || '');
      } else {
        setName('');
        setDescription('');
        setImageUrl('');
        setImagePreview('');
        setPriceStr('');
        setHappyHourPriceStr('');
        setStockQuantityStr('');
        setIsActive(true);
        setSelectedCategory(null);
        setCategoryQuery('');
        setAddons([]);
        setSelectedUpsellIds([]);
        setUpsellMessage('');
      }
    }
  }, [open, productToEdit]);

  // Sync categories prop
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Click outside listener for category combobox
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
  );

  const exactCategoryMatch = categories.some(
    (cat) => cat.name.trim().toLowerCase() === categoryQuery.trim().toLowerCase(),
  );

  const handleSelectCategory = (cat: CategoryDocument) => {
    setSelectedCategory({ id: cat.$id, name: cat.name });
    setCategoryQuery(cat.name);
    setIsCategoryDropdownOpen(false);
  };

  const handleCreateCategory = async () => {
    const trimmed = categoryQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsCreatingCategory(true);
    try {
      const res = await createCategoryAction(trimmed);
      if (res.success && res.category) {
        setCategories((prev) => [...prev, res.category!]);
        setSelectedCategory({ id: res.category.$id, name: res.category.name });
        setCategoryQuery(res.category.name);
        setIsCategoryDropdownOpen(false);
      } else {
        setErrorMsg(res.message || 'Erro ao criar categoria.');
      }
    } catch {
      setErrorMsg('Erro inesperado ao criar categoria.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Arquivo muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setIsUploadingImage(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadProductImageAction(formData);

      if (res.success && res.imageUrl) {
        setImageUrl(res.imageUrl);
      } else {
        setErrorMsg(res.message || 'Falha ao enviar imagem.');
      }
    } catch {
      setErrorMsg('Erro ao fazer upload da imagem.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Addons handlers
  const handleAddAddon = () => {
    setAddons((prev) => [
      ...prev,
      { id: `addon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, name: '', priceStr: '' },
    ]);
  };

  const handleRemoveAddon = (index: number) => {
    setAddons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAddonName = (index: number, val: string) => {
    setAddons((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: val };
      return copy;
    });
  };

  const handleUpdateAddonPrice = (index: number, val: string) => {
    setAddons((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], priceStr: maskCurrencyInput(val) };
      return copy;
    });
  };

  // Upsell handlers
  const availableUpsellProducts = allProducts.filter(
    (p) => !productToEdit || p.$id !== productToEdit.$id,
  );

  const toggleUpsellProduct = (id: string) => {
    setSelectedUpsellIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCategory) {
      setErrorMsg('Por favor, selecione ou crie uma categoria para o produto.');
      return;
    }

    const priceCents = parseBrlToCents(priceStr);
    if (!priceCents || priceCents <= 0) {
      setErrorMsg('O preço regular do produto deve ser maior que zero.');
      return;
    }

    const happyHourCents = happyHourPriceStr ? parseBrlToCents(happyHourPriceStr) : null;
    if (happyHourCents != null && happyHourCents >= priceCents) {
      setErrorMsg('O preço de Happy Hour deve ser estritamente menor que o preço regular.');
      return;
    }

    const parsedAddons: ProductAddon[] = addons
      .filter((a) => a.name.trim().length > 0)
      .map((a) => ({
        id: a.id,
        name: a.name.trim(),
        price: parseBrlToCents(a.priceStr),
      }));

    const stock = stockQuantityStr.trim() !== '' ? parseInt(stockQuantityStr, 10) : null;
    if (stock != null && (isNaN(stock) || stock < 0)) {
      setErrorMsg('A quantidade em estoque deve ser um número maior ou igual a zero.');
      return;
    }

    const payload: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      price: priceCents,
      happyHourPrice: happyHourCents,
      stockQuantity: stock,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      isActive,
      addons: parsedAddons,
      upsellProductIds: selectedUpsellIds,
      upsellMessage: upsellMessage.trim() || null,
    };

    setIsSubmitting(true);
    try {
      const res = await saveProductAction(payload, productToEdit?.$id);
      if (res.success && res.product) {
        onSuccess(res.product);
        onOpenChange(false);
      } else {
        const fieldError = res.errors ? Object.values(res.errors).flat()[0] : null;
        setErrorMsg(fieldError || res.message || 'Erro ao salvar produto.');
      }
    } catch {
      setErrorMsg('Erro inesperado de comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3.5 sm:pb-4 border-b border-zinc-100 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900">
            {productToEdit ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Preencha os detalhes do item para exibição no cardápio digital e mesas.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Imagem do Produto */}
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Foto do Produto
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-2xl bg-zinc-100 border border-dashed border-zinc-300 flex items-center justify-center overflow-hidden shrink-0">
                {imagePreview || imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview || imageUrl}
                    alt="Preview do produto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-400" />
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full gap-1.5 text-xs h-8 px-4 font-medium"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {imagePreview || imageUrl ? 'Trocar Imagem' : 'Enviar Foto'}
                </Button>
                {(imagePreview || imageUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageUrl('');
                      setImagePreview('');
                    }}
                    className="text-xs text-zinc-500 hover:text-red-600 h-7 px-2 justify-start"
                  >
                    Remover foto
                  </Button>
                )}
                <span className="text-[11px] text-zinc-400">
                  PNG, JPG ou WebP até 5MB.
                </span>
              </div>
            </div>
          </div>

          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
                Nome do Produto <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Hambúrguer Clássico"
                className="h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Categoria Combobox */}
            <div ref={comboboxRef} className="relative">
              <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
                Categoria <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={categoryQuery}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  onChange={(e) => {
                    setCategoryQuery(e.target.value);
                    setIsCategoryDropdownOpen(true);
                    if (selectedCategory && selectedCategory.name !== e.target.value) {
                      setSelectedCategory(null);
                    }
                  }}
                  placeholder="Selecione ou digite para criar..."
                  className="h-[44px] w-full rounded-xl border border-zinc-200 bg-white pl-3.5 pr-10 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <ChevronsUpDown className="w-4 h-4" />
                </button>
              </div>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.$id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left text-zinc-800 hover:bg-zinc-100 transition-colors"
                    >
                      <span className="font-medium">{cat.name}</span>
                      {selectedCategory?.id === cat.$id && (
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </button>
                  ))}

                  {/* Opção inline de criar categoria digitada se não houver match idêntico */}
                  {categoryQuery.trim().length >= 2 && !exactCategoryMatch && (
                    <button
                      type="button"
                      disabled={isCreatingCategory}
                      onClick={handleCreateCategory}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs rounded-lg text-left text-amber-700 bg-amber-50/80 hover:bg-amber-100/80 transition-colors font-medium border-t border-amber-100 mt-1"
                    >
                      {isCreatingCategory ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Criar categoria &quot;{categoryQuery.trim()}&quot;
                    </button>
                  )}

                  {filteredCategories.length === 0 && !categoryQuery.trim() && (
                    <div className="p-3 text-center text-xs text-zinc-400">
                      Nenhuma categoria cadastrada. Digite um nome para criar.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Descrição do Produto
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes, detalhes e notas especiais..."
              className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
            <span className="text-[11px] text-zinc-400 block text-right mt-1">
              {description.length}/300 caracteres
            </span>
          </div>

          {/* Preços e Estoque */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
                Preço Regular (R$) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  R$
                </span>
                <input
                  type="text"
                  required
                  value={priceStr}
                  onChange={(e) => setPriceStr(maskCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="h-[44px] w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
                Preço Happy Hour (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  R$
                </span>
                <input
                  type="text"
                  value={happyHourPriceStr}
                  onChange={(e) => setHappyHourPriceStr(maskCurrencyInput(e.target.value))}
                  placeholder="Opcional"
                  className="h-[44px] w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
                Estoque (unidades)
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantityStr}
                onChange={(e) => setStockQuantityStr(e.target.value)}
                placeholder="Ilimitado"
                className="h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>

          {/* Switch de Ativação */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div>
              <span className="text-sm font-semibold text-zinc-900 block">
                Disponível para Pedidos
              </span>
              <span className="text-xs text-zinc-500">
                Se desativado, o item fica oculto para os clientes na mesa.
              </span>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked)}
            />
          </div>

          {/* Adicionais / Opcionais */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-[13px] font-semibold text-zinc-900 block">
                  Adicionais & Complementos (Opcional)
                </span>
                <span className="text-xs text-zinc-500">
                  Itens extras que o cliente pode adicionar ao pedido.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleAddAddon}
                className="rounded-full gap-1 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {addons.map((addon, index) => (
                <div key={addon.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => handleUpdateAddonName(index, e.target.value)}
                    placeholder="Ex: Bacon Extra"
                    className="h-9 flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 outline-none focus:border-amber-500"
                  />
                  <div className="relative w-24 sm:w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-400">
                      R$
                    </span>
                    <input
                      type="text"
                      value={addon.priceStr}
                      onChange={(e) => handleUpdateAddonPrice(index, e.target.value)}
                      placeholder="0,00"
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-2 text-xs text-zinc-900 outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(index)}
                    className="p-1.5 shrink-0 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {addons.length === 0 && (
                <div className="text-xs text-zinc-400 italic py-1">
                  Nenhum adicional cadastrado para este produto.
                </div>
              )}
            </div>
          </div>

          {/* Upsell / Combina com este item */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[13px] font-semibold text-zinc-900 block">
                  Upsell: Sugestão de Compra Conjunta (Opcional)
                </span>
                <span className="text-xs text-zinc-500">
                  Indique produtos que combinam com este item para oferecer no carrinho.
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUpsellDropdownOpen((prev) => !prev)}
                className="w-full min-h-[44px] flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-800 outline-none hover:border-zinc-300 transition-colors"
              >
                <div className="flex flex-wrap gap-1.5">
                  {selectedUpsellIds.length === 0 ? (
                    <span className="text-zinc-400">Selecione produtos para recomendar...</span>
                  ) : (
                    selectedUpsellIds.map((id) => {
                      const prod = allProducts.find((p) => p.$id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 text-zinc-800 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        >
                          {prod?.name || 'Produto'}
                          <X
                            className="w-3 h-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              toggleUpsellProduct(id);
                            }}
                          />
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
              </button>

              {isUpsellDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
                  {availableUpsellProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-400">
                      Nenhum outro produto disponível para recomendação.
                    </div>
                  ) : (
                    availableUpsellProducts.map((p) => {
                      const isSelected = selectedUpsellIds.includes(p.$id);
                      return (
                        <button
                          key={p.$id}
                          type="button"
                          onClick={() => toggleUpsellProduct(p.$id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left text-zinc-800 hover:bg-zinc-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-[11px] text-zinc-400">
                              ({formatCentsToBrl(p.price)})
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Mensagem customizada de upsell */}
            <div className="mt-3">
              <label className="block text-[12px] font-medium text-zinc-700 mb-1">
                Frase de Sugestão (Opcional)
              </label>
              <input
                type="text"
                maxLength={120}
                value={upsellMessage}
                onChange={(e) => setUpsellMessage(e.target.value)}
                placeholder="Ex: Vai uma porção de batatas crocantes para acompanhar?"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <span className="text-[10px] text-zinc-400 block text-right mt-1">
                {upsellMessage.length}/120 caracteres
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-zinc-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0 bg-zinc-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto justify-center rounded-full text-xs font-medium px-5 h-9"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            className="w-full sm:w-auto justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-6 h-9 gap-2 shadow-xs transition-transform active:scale-95"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {productToEdit ? 'Atualizar Produto' : 'Cadastrar Produto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
