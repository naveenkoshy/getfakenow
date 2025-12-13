import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface ProductFormProps {
  productId?: number;
  initialData?: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    imageUrl?: string;
  };
  onSuccess?: () => void;
}

export function ProductForm({ productId, initialData, onSuccess }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price ? (initialData.price / 100).toFixed(2) : "");
  const [categoryId, setCategoryId] = useState<number>(initialData?.categoryId || 1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      utils.products.invalidate();
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });
  
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully!");
      utils.products.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error("No image selected");

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const base64 = await base64Promise;
      
      // Upload to S3 via backend
      const uploadResult = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          filename: imageFile.name,
        }),
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload image");
      }

      const { url } = await uploadResult.json();
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      let imageUrl = imagePreview; // Keep existing image if no new one uploaded
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const productData = {
        name,
        description,
        price: priceInCents,
        categoryId,
        imageUrl,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      };

      if (productId) {
        // Update existing product
        updateProduct.mutate({
          id: productId,
          ...productData,
        });
      } else {
        // Create new product
        createProduct.mutate(productData);
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategoryId(1);
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fake Signature Hoodie"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description..."
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (RM) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="65.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={categoryId.toString()} onValueChange={(value) => setCategoryId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Casual</SelectItem>
                <SelectItem value="2">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Product Image</Label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview("");
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createProduct.isPending || updateProduct.isPending || isUploading}
            className="flex-1"
          >
            {isUploading ? "Uploading..." : productId ? (updateProduct.isPending ? "Updating..." : "Update Product") : (createProduct.isPending ? "Creating..." : "Create Product")}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}
