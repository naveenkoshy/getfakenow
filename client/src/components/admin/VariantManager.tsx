/**
 * VariantManager — Admin UI for managing product variants (size/color combos).
 *
 * Two sections:
 * 1. Attribute definition — add/remove size values, color values
 * 2. Variant table — auto-generated from Cartesian product with inline-editable
 *    price, stock, SKU, and image per variant
 *
 * Usage:
 *   <VariantManager productId={productId} />
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Sparkles,
  Package,
  Pencil,
  Check,
  AlertTriangle,
} from "lucide-react";

interface VariantManagerProps {
  productId: number;
  /** The parent product's base price in sen */
  basePrice?: number;
}

interface AttributeState {
  name: string;
  values: string[];
  newValue: string;
}

export function VariantManager({ productId, basePrice = 0 }: VariantManagerProps) {
  const utils = trpc.useUtils();
  const { data: variants, isLoading } = trpc.admin.variants.list.useQuery({ productId });
  const { data: existingAttributes } = trpc.admin.variants.getAttributes.useQuery({ productId });

  const createVariant = trpc.admin.variants.create.useMutation({
    onSuccess: () => { utils.admin.variants.list.invalidate({ productId }); toast.success("Variant created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateVariant = trpc.admin.variants.update.useMutation({
    onSuccess: () => { utils.admin.variants.list.invalidate({ productId }); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteVariant = trpc.admin.variants.delete.useMutation({
    onSuccess: () => { utils.admin.variants.list.invalidate({ productId }); toast.success("Variant deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const bulkGenerate = trpc.admin.variants.bulkGenerate.useMutation({
    onSuccess: (data) => {
      utils.admin.variants.list.invalidate({ productId });
      utils.admin.variants.getAttributes.invalidate({ productId });
      toast.success(`Generated ${data.count} variants`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Attribute editing state
  const [attributes, setAttributes] = useState<AttributeState[]>([
    { name: "size", values: [], newValue: "" },
    { name: "color", values: [], newValue: "" },
  ]);

  // Populate from saved attributes
  useEffect(() => {
    if (!existingAttributes || existingAttributes.length === 0) return;
    const grouped: Record<string, string[]> = {};
    existingAttributes.forEach((opt: any) => {
      if (!grouped[opt.attributeName]) grouped[opt.attributeName] = [];
      grouped[opt.attributeName].push(opt.attributeValue);
    });
    setAttributes(
      Object.entries(grouped).map(([name, values]) => ({ name, values, newValue: "" })),
    );
  }, [existingAttributes]);

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    price: string;
    stockQuantity: string;
    sku: string;
  }>({ price: "", stockQuantity: "", sku: "" });

  const addAttributeValue = (attrIndex: number) => {
    const attr = attributes[attrIndex];
    const val = attr.newValue.trim();
    if (!val || attr.values.includes(val)) return;
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === attrIndex ? { ...a, values: [...a.values, val], newValue: "" } : a,
      ),
    );
  };

  const removeAttributeValue = (attrIndex: number, valIndex: number) => {
    setAttributes((prev) =>
      prev.map((a, i) =>
        i === attrIndex
          ? { ...a, values: a.values.filter((_, vi) => vi !== valIndex) }
          : a,
      ),
    );
  };

  const addAttribute = () => {
    setAttributes((prev) => [...prev, { name: "", values: [], newValue: "" }]);
  };

  const removeAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    const valid = attributes.filter((a) => a.name.trim() && a.values.length > 0);
    if (valid.length === 0) {
      toast.error("Add at least one attribute with values to generate variants");
      return;
    }
    bulkGenerate.mutate({
      productId,
      attributes: valid.map((a) => ({ name: a.name, values: a.values })),
    });
  };

  const startEdit = (variant: any) => {
    setEditingId(variant.id);
    setEditForm({
      price: variant.price != null ? (variant.price / 100).toFixed(2) : "",
      stockQuantity: String(variant.stockQuantity),
      sku: variant.sku || "",
    });
  };

  const saveEdit = (variant: any) => {
    const price = editForm.price ? Math.round(parseFloat(editForm.price) * 100) : null;
    const stockQuantity = parseInt(editForm.stockQuantity) || 0;
    updateVariant.mutate({
      id: variant.id,
      productId,
      price,
      stockQuantity,
      sku: editForm.sku || null,
    });
    setEditingId(null);
  };

  const formatPrice = (sen: number | null) => {
    if (sen == null) return "—";
    return `RM ${(sen / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Attribute Definition */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Variant Attributes</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Define the attributes (e.g., size, color) and their values. Then generate variants.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addAttribute}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Attribute
            </Button>
          </div>

          {attributes.map((attr, attrIdx) => (
            <div key={attrIdx} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={attr.name}
                  onChange={(e) =>
                    setAttributes((prev) =>
                      prev.map((a, i) => (i === attrIdx ? { ...a, name: e.target.value } : a)),
                    )
                  }
                  placeholder="Attribute name (e.g., size)"
                  className="w-40 text-sm font-medium"
                />
                {attributes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(attrIdx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Value chips */}
              <div className="flex flex-wrap gap-1.5">
                {attr.values.map((val, valIdx) => (
                  <Badge
                    key={valIdx}
                    className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1 pr-1"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => removeAttributeValue(attrIdx, valIdx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add value input */}
              <div className="flex gap-2">
                <Input
                  value={attr.newValue}
                  onChange={(e) =>
                    setAttributes((prev) =>
                      prev.map((a, i) => (i === attrIdx ? { ...a, newValue: e.target.value } : a)),
                    )
                  }
                  placeholder={`Add ${attr.name || "value"}…`}
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttributeValue(attrIdx))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addAttributeValue(attrIdx)}
                  disabled={!attr.newValue.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={handleGenerate}
            disabled={bulkGenerate.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {bulkGenerate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Variants
          </Button>

          {attributes.some((a) => a.values.length > 0) && (
            <p className="text-xs text-gray-400 text-center">
              This will create{" "}
              {attributes
                .filter((a) => a.values.length > 0)
                .reduce((acc, a) => acc * a.values.length, 1)}{" "}
              variant{attributes.reduce((acc, a) => acc * Math.max(a.values.length, 1), 1) !== 1 ? "s" : ""}.
              Existing variants will be preserved.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Variant Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : variants && variants.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Variant</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">SKU</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Price</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Stock</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600">Active</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant: any) => (
                    <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{variant.name}</span>
                          {variant.size && (
                            <Badge className="bg-blue-50 text-blue-700 text-[10px]">{variant.size}</Badge>
                          )}
                          {variant.color && (
                            <Badge className="bg-purple-50 text-purple-700 text-[10px]">{variant.color}</Badge>
                          )}
                        </div>
                      </td>

                      {editingId === variant.id ? (
                        <>
                          <td className="px-4 py-2.5">
                            <Input
                              value={editForm.sku}
                              onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
                              className="h-8 text-xs w-24"
                              placeholder="SKU"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Input
                              value={editForm.price}
                              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                              className="h-8 text-xs w-24 text-right ml-auto"
                              placeholder="RM"
                              type="number"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Input
                              value={editForm.stockQuantity}
                              onChange={(e) => setEditForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                              className="h-8 text-xs w-20 text-right ml-auto"
                              type="number"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Switch
                              checked={variant.active}
                              onCheckedChange={(checked) =>
                                updateVariant.mutate({ id: variant.id, productId, active: checked })
                              }
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveEdit(variant)}
                                className="h-7 w-7 p-0 text-green-600"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="h-7 w-7 p-0 text-gray-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">
                            {variant.sku || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700">
                            {formatPrice(variant.price)}
                            {variant.price == null && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                (base: {formatPrice(basePrice)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className={
                                variant.stockQuantity === 0
                                  ? "text-red-600 font-semibold"
                                  : variant.stockQuantity <= 5
                                    ? "text-amber-600 font-medium"
                                    : "text-gray-700"
                              }
                            >
                              {variant.stockQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <Switch
                              checked={variant.active}
                              onCheckedChange={(checked) =>
                                updateVariant.mutate({ id: variant.id, productId, active: checked })
                              }
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(variant)}
                                className="h-7 w-7 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteVariant.mutate({ id: variant.id, productId })}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
              <span>
                Total stock:{" "}
                <strong className="text-gray-700">
                  {variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No variants yet</p>
          <p className="text-xs mt-1">Define attributes above and click Generate to create variant combinations.</p>
        </div>
      )}
    </div>
  );
}
