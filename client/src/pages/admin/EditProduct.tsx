import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { ProductForm } from "@/components/ProductForm";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const productId = parseInt(id || "0");
  
  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: productId });
  const utils = trpc.useUtils();
  
  const updateMutation = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      utils.admin.products.list.invalidate();
      utils.products.getById.invalidate({ id: productId });
      setLocation("/admin/products");
    },
  });

  // No need for handleSubmit - ProductForm handles it internally

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => setLocation("/admin/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product details and images
            </p>
          </div>
        </div>

        <ProductForm
          productId={productId}
          initialData={{
            name: product.name,
            description: product.description || "",
            price: product.price,
            categoryId: product.categoryId,
            imageUrl: product.imageUrl || "",
          }}
          onSuccess={() => setLocation("/admin/products")}
        />
      </div>
    </AdminLayout>
  );
}
