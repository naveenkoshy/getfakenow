import { AdminLayout } from "@/components/AdminLayout";
import { ProductForm } from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AddProduct() {
  const [, setLocation] = useLocation();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin/products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <h1 className="text-3xl font-bold">Add New Product</h1>
        </div>

        <ProductForm onSuccess={() => setLocation("/admin/products")} />
      </div>
    </AdminLayout>
  );
}
