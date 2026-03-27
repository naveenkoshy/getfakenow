import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Search, Pencil, Trash2, Download, Loader2, Package, HelpCircle,
  AlertTriangle, Star, Eye, CheckCircle2, XCircle
} from "lucide-react";
import { Link } from "wouter";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { data: productsData, isLoading } = trpc.admin.products.list.useQuery({});
  const products = productsData?.products;
  const utils = trpc.useUtils();

  const deleteMutation = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success(`"${deleteTarget?.name}" deleted successfully`);
      utils.admin.products.list.invalidate();
      setDeleteTarget(null);
    },
    onError: (e: any) => { toast.error(`Failed to delete: ${e.message}`); setDeleteTarget(null); },
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await utils.admin.export.products.fetch();
      if (result && result.csv) {
        const bom = '\uFEFF';
        const blob = new Blob([bom + result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Products exported successfully");
      }
    } catch {
      toast.error('Failed to export products. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (cents: number) => `RM${(cents / 100).toFixed(2)}`;

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProducts = products?.length || 0;
  const featuredCount = products?.filter(p => p.featured).length || 0;
  const outOfStockCount = products?.filter(p => p.stockQuantity === 0).length || 0;
  const lowStockCount = products?.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your product catalog — {totalProducts} product{totalProducts !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportCSV} disabled={isExporting || isLoading}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export CSV
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Products", value: totalProducts, icon: Package, color: "text-gray-900" },
            { label: "Featured", value: featuredCount, icon: Star, color: "text-amber-600" },
            { label: "Low Stock", value: lowStockCount, icon: AlertTriangle, color: "text-yellow-600" },
            { label: "Out of Stock", value: outOfStockCount, icon: XCircle, color: "text-red-600" },
          ].map(s => (
            <Card key={s.label} className="bg-white border-gray-200">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <HelpText>Search across product names and URL slugs. Use the Add Product button to create new listings.</HelpText>
        </div>

        {/* Products Table */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500 font-mono">/{product.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">Category {product.categoryId}</TableCell>
                      <TableCell className="font-medium">{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          product.stockQuantity === 0 ? "bg-red-100 text-red-700" :
                          product.stockQuantity <= 10 ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {product.stockQuantity === 0 ? <XCircle className="h-3 w-3" /> :
                           product.stockQuantity <= 10 ? <AlertTriangle className="h-3 w-3" /> :
                           <CheckCircle2 className="h-3 w-3" />}
                          {product.stockQuantity} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.featured ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {product.featured ? <><Star className="h-3 w-3" /> Featured</> : "Standard"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild title="Edit product">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Delete product"
                            onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium text-gray-600">{searchQuery ? "No products match your search" : "No products yet"}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchQuery ? "Try a different search term." : "Add your first product to get started."}
                      </p>
                      {!searchQuery && (
                        <Button asChild variant="outline" className="mt-3">
                          <Link href="/admin/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
              This action cannot be undone. The product will be removed from your catalog, and any active orders referencing it will retain historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id }); }}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
