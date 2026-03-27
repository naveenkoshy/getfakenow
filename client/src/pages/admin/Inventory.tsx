import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2, AlertTriangle, CheckCircle2, Package, Save, HelpCircle, Search, Undo2
} from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminInventory() {
  const { data: products, isLoading, refetch } = trpc.admin.products.list.useQuery({ limit: 200, offset: 0 });
  const { data: lowStock } = trpc.admin.inventory.lowStock.useQuery({ threshold: 10 });
  const { data: outOfStock } = trpc.admin.inventory.outOfStock.useQuery();
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);

  const bulkUpdate = trpc.admin.inventory.bulkUpdate.useMutation({
    onSuccess: () => { toast.success(`${Object.keys(edits).length} product(s) stock updated`); setEdits({}); refetch(); setConfirmSave(false); },
    onError: (e) => { toast.error(e.message); setConfirmSave(false); },
  });

  const handleSave = () => {
    const updates = Object.entries(edits).map(([id, qty]) => ({ productId: Number(id), quantity: qty }));
    if (updates.length === 0) return toast.info("No changes to save");
    setConfirmSave(true);
  };

  const executeSave = () => {
    const updates = Object.entries(edits).map(([id, qty]) => ({ productId: Number(id), quantity: qty }));
    bulkUpdate.mutate({ updates });
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700", icon: <Package className="h-3 w-3" /> };
    if (qty <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700", icon: <AlertTriangle className="h-3 w-3" /> };
    return { label: "In Stock", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  const editCount = Object.keys(edits).length;
  const productList = products?.products || [];
  const filteredProducts = productList.filter((p: any) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage stock levels across all products</p>
          </div>
          <div className="flex items-center gap-2">
            {editCount > 0 && (
              <Button variant="outline" onClick={() => setEdits({})} title="Discard changes">
                <Undo2 className="h-4 w-4 mr-2" /> Discard ({editCount})
              </Button>
            )}
            <Button onClick={handleSave} disabled={editCount === 0 || bulkUpdate.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {bulkUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes ({editCount})
            </Button>
          </div>
        </div>

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> How Inventory Works</p>
            <p className="mt-1 text-blue-700">
              Edit stock quantities in the "New Stock" column and click Save Changes to update in bulk.
              Products with stock at or below 10 units are flagged as "Low Stock". Out-of-stock products are automatically hidden from the storefront.
              Changes are highlighted in blue until saved.
            </p>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{(products?.total || 0) - (lowStock?.length || 0) - (outOfStock?.length || 0)}</p>
                  <p className="text-xs text-gray-500">In Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{lowStock?.length || 0}</p>
                  <p className="text-xs text-gray-500">Low Stock (&le;10)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{outOfStock?.length || 0}</p>
                  <p className="text-xs text-gray-500">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by product name or SKU..." className="pl-10" />
        </div>

        {/* Unsaved changes banner */}
        {editCount > 0 && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-2 px-4 text-sm text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>You have <strong>{editCount} unsaved change(s)</strong>. Click "Save Changes" to apply, or "Discard" to revert.</span>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : !filteredProducts.length ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{searchQuery ? "No products match your search" : "No products in inventory"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Product</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">SKU</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Current Stock</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">New Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((p: any) => {
                      const status = getStockStatus(p.stockQuantity);
                      const hasEdit = edits[p.id] !== undefined;
                      return (
                        <tr key={p.id} className={`transition-colors ${hasEdit ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku || "—"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.stockQuantity}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                className={`w-24 h-9 ${hasEdit ? "border-blue-400 ring-1 ring-blue-200" : ""}`}
                                placeholder={String(p.stockQuantity)}
                                value={edits[p.id] !== undefined ? edits[p.id] : ""}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (isNaN(val)) {
                                    const newEdits = { ...edits };
                                    delete newEdits[p.id];
                                    setEdits(newEdits);
                                  } else {
                                    setEdits({ ...edits, [p.id]: Math.max(0, val) });
                                  }
                                }}
                              />
                              {hasEdit && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {edits[p.id]! > p.stockQuantity ? `+${edits[p.id]! - p.stockQuantity}` : edits[p.id]! < p.stockQuantity ? `${edits[p.id]! - p.stockQuantity}` : "="}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Confirmation */}
      <AlertDialog open={confirmSave} onOpenChange={(o) => { if (!o && !bulkUpdate.isPending) setConfirmSave(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Update</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update stock levels for <strong>{editCount} product(s)</strong>.
              This will immediately affect product availability on the storefront. Please verify the changes are correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 overflow-y-auto my-2">
            {Object.entries(edits).map(([id, qty]) => {
              const product = productList.find((p: any) => p.id === Number(id));
              if (!product) return null;
              return (
                <div key={id} className="flex items-center justify-between py-1.5 text-sm border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{product.name}</span>
                  <span className="font-mono text-xs">
                    <span className="text-gray-400">{product.stockQuantity}</span>
                    <span className="mx-1">&rarr;</span>
                    <span className={qty > product.stockQuantity ? "text-green-600" : qty < product.stockQuantity ? "text-red-600" : "text-gray-600"}>{qty}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkUpdate.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={bulkUpdate.isPending}
              onClick={(e) => { e.preventDefault(); executeSave(); }}
            >
              {bulkUpdate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
