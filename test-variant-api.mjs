import { getProductBySlug, getProductImages } from "./server/db.ts";

const slug = "fake-signature-hoodie";

console.log("Testing product data for:", slug);

const product = await getProductBySlug(slug);

if (!product) {
  console.log("Product not found!");
  process.exit(1);
}

console.log("\n=== Product Data ===");
console.log("ID:", product.id);
console.log("Name:", product.name);
console.log("Main Image URL:", product.imageUrl);

const images = await getProductImages(product.id);

console.log("\n=== Product Images ===");
console.log("Total images:", images.length);
images.forEach((img, idx) => {
  console.log(`\nImage ${idx + 1}:`);
  console.log("  Color:", img.color);
  console.log("  URL:", img.imageUrl);
  console.log("  Sort Order:", img.sortOrder);
});

process.exit(0);
