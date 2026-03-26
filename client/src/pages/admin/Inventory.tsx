import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle2, Package, Save } from "lucide-react";

export default function AdminInventory() {
  const { data: products, isLoading, refetch } = trpc.admin.products.list.useQuery({ limit: 200, offset: 0 });
  const { data: lowStock } = trpc.admin.inventory.lowStock.useQuery({ threshold: 10 });
  const { data: outOfStock } = trpc.admin.inventory.outOfStock.useQuery();
  const [edits, setEdits] = useState<Record<number, number>>({});

  const bulkUpdate = trpc.admin.inventory.bulkUpdate.useMutation({
    onSuccess: () => { toast.success("Stock updated"); setEdits({}); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const updates = Object.entries(edits).map(([id, qty]) => ({ productId: Number(id), quantity: qty }));
    if (updates.length === 0) return toast.info("No changes to save");
    bulkUpdate.mutate({ updates });
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (qty <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage stock levels across all products</p>
          </div>
          <Button onClick={handleSave} disabled={Object.keys(edits).length === 0 || bulkUpdate.isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {bulkUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes ({Object.keys(edits).length})
          </Button>
        </div>

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

        {/* Inventory Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
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
                    {products?.products?.map((p: any) => {
                      const status = getStockStatus(p.stockQuantity);
                      const hasEdit = edits[p.id] !== undefined;
                      return (
                        <tr key={p.id} className={`transition-colors ${hasEdit ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
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
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.stockQuantity}</td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              min={0}
                              className="w-24 h-9"
                              placeholder={String(p.stockQuantity)}
                              value={edits[p.id] !== undefined ? edits[p.id] : ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (isNaN(val)) {
                                  const newEdits = { ...edits };
                                  delete newEdits[p.id];
                                  setEdits(newEdits);
                                } else {
                                  setEdits({ ...edits, [p.id]: val });
                                }
                              }}
                            />
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
    </AdminLayout>
  );
}
