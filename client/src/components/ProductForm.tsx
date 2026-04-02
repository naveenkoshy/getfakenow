import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, X, HelpCircle, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{children}</span></p>;
}

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const utils = trpc.useUtils();
  const createProduct = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      utils.admin.products.invalidate();
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => toast.error(`Failed to create product: ${error.message}`),
  });

  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully!");
      utils.admin.products.invalidate();
      onSuccess?.();
    },
    onError: (error: any) => toast.error(`Failed to update product: ${error.message}`),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file (JPEG, PNG, WebP, GIF)"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error("No image selected");
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const uploadResult = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, filename: imageFile.name }),
      });
      if (!uploadResult.ok) throw new Error("Failed to upload image");
      const { url } = await uploadResult.json();
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Product name is required";
    else if (name.length < 3) errs.name = "Name must be at least 3 characters";
    if (!description.trim()) errs.description = "Description is required";
    else if (description.length < 10) errs.description = "Description should be at least 10 characters for SEO";
    if (!price) errs.price = "Price is required";
    else {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) errs.price = "Enter a valid price greater than 0";
      else if (p > 100000) errs.price = "Price cannot exceed RM100,000";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, description: true, price: true });
    if (!validate()) return;

    const priceInCents = Math.round(parseFloat(price) * 100);
    try {
      let imageUrl = imagePreview;
      if (imageFile) imageUrl = await uploadImage();

      const productData = {
        name,
        description,
        price: priceInCents,
        categoryId,
        imageUrl,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      };

      if (productId) {
        updateProduct.mutate({ id: productId, ...productData });
      } else {
        createProduct.mutate(productData);
      }
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setCategoryId(1);
    setImageFile(null); setImagePreview(""); setErrors({}); setTouched({});
  };

  const isPending = createProduct.isPending || updateProduct.isPending || isUploading;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(prev => ({ ...prev, name: "" })); }}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="e.g., Premium Cotton Hoodie"
            className={errors.name && touched.name ? "border-red-500" : ""}
          />
          {errors.name && touched.name ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.name}</p>
          ) : (
            <HelpText>The product name shown to customers. Will also generate the URL slug: /{slug || "product-name"}</HelpText>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
          <RichTextEditor
            content={description}
            onChange={(html) => { setDescription(html); if (touched.description) setErrors(prev => ({ ...prev, description: "" })); }}
            placeholder="Describe your product in detail — materials, sizing, care instructions…"
            minHeight={160}
            compact
            error={!!(errors.description && touched.description)}
          />
          {errors.description && touched.description ? (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.description}</p>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <HelpText>A detailed description helps with SEO and customer decision-making. Include materials, dimensions, and care instructions.</HelpText>
              <span className="text-xs text-gray-400">{description.length} chars</span>
            </div>
          )}
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (RM) <span className="text-red-500">*</span></Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => { setPrice(e.target.value); if (touched.price) setErrors(prev => ({ ...prev, price: "" })); }}
              onBlur={() => setTouched(prev => ({ ...prev, price: true }))}
              placeholder="65.00"
              className={errors.price && touched.price ? "border-red-500" : ""}
            />
            {errors.price && touched.price ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.price}</p>
            ) : (
              <HelpText>Enter the retail price in Malaysian Ringgit. Stored as cents internally.</HelpText>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select value={categoryId.toString()} onValueChange={(value) => setCategoryId(parseInt(value))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Casual</SelectItem>
                <SelectItem value="2">Professional</SelectItem>
              </SelectContent>
            </Select>
            <HelpText>Assign a category to help customers find this product. Categories are managed under Catalog &gt; Categories.</HelpText>
          </div>
        </div>

        {/* Image */}
        <div>
          <Label>Product Image</Label>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(""); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Image set
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-red-300 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP (MAX. 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            )}
          </div>
          <HelpText>Upload a high-quality product image. Recommended size: 800x800px or larger. Square images work best for catalog grids.</HelpText>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-2 border-t border-gray-200">
          <Button type="submit" disabled={isPending} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isUploading ? "Uploading image..." : productId ? (updateProduct.isPending ? "Updating..." : "Update Product") : (createProduct.isPending ? "Creating..." : "Create Product")}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
        </div>
      </form>
    </Card>
  );
}
