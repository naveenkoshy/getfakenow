/**
 * ProductPicker — Modal dialog for selecting products by search.
 * Used in PageBuilder's productGrid block to hand-pick products.
 */
import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, Package, Check, X, GripVertical } from "lucide-react";

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (productIds: number[]) => void;
  selectedIds?: number[];
  multiple?: boolean;
  maxSelection?: number;
}

export function ProductPicker({ open, onClose, onSelect, selectedIds = [], multiple = true, maxSelection = 24 }: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>(selectedIds);

  const { data: productsData, isLoading } = trpc.admin.products.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: open }
  );

  const products = useMemo(() => {
    const all = (productsData as any)?.products || productsData || [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((p: any) =>
      p.name.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  }, [productsData, search]);

  const toggleProduct = (id: number) => {
    if (!multiple) {
      setSelected([id]);
      return;
    }
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= maxSelection ? prev : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const formatCurrency = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Select Products
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? `Choose up to ${maxSelection} products. ${selected.length} selected.`
              : "Choose a product."}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, or ID..."
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {selected.map(id => {
              const p = (products || []).find((x: any) => x.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
                  {p?.name || `#${id}`}
                  <button onClick={() => toggleProduct(id)} className="hover:text-red-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Product list */}
        <div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-gray-100 min-h-[200px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !products?.length ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{search ? "No products match your search" : "No products found"}</p>
            </div>
          ) : (
            products.map((p: any) => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected ? "bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatCurrency(p.price)}</span>
                      <span>Stock: {p.stockQuantity}</span>
                      <span className="font-mono text-gray-400">#{p.id}</span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-red-600 border-red-600" : "border-gray-300"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {multiple ? `Select ${selected.length} Product${selected.length !== 1 ? "s" : ""}` : "Select"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
