/**
 * Audit current product image naming and generate SEO-optimized names
 */
import { getDb } from '../server/db';
import { products, productImages } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ImageAudit {
  id: number;
  productName: string;
  slug: string;
  currentUrl: string;
  currentFilename: string;
  suggestedFilename: string;
  suggestedUrl: string;
  color?: string;
  type: 'main' | 'variant';
}

async function auditImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  const audits: ImageAudit[] = [];

  // Audit main product images
  const allProducts = await db.select().from(products);
  
  console.log('\n=== MAIN PRODUCT IMAGES ===\n');
  
  for (const product of allProducts) {
    if (!product.imageUrl) continue;
    
    const currentFilename = product.imageUrl.split('/').pop() || '';
    const suggestedFilename = generateSeoFilename(product.name, product.slug);
    const suggestedUrl = product.imageUrl.replace(currentFilename, suggestedFilename);
    
    audits.push({
      id: product.id,
      productName: product.name,
      slug: product.slug,
      currentUrl: product.imageUrl,
      currentFilename,
      suggestedFilename,
      suggestedUrl,
      type: 'main'
    });
    
    console.log(`Product: ${product.name}`);
    console.log(`  Current:   ${currentFilename}`);
    console.log(`  Suggested: ${suggestedFilename}`);
    console.log('');
  }

  // Audit variant images
  const allVariants = await db
    .select({
      id: productImages.id,
      productId: productImages.productId,
      imageUrl: productImages.imageUrl,
      color: productImages.color,
      sortOrder: productImages.sortOrder,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productImages)
    .leftJoin(products, eq(products.id, productImages.productId));

  console.log('\n=== COLOR VARIANT IMAGES ===\n');

  for (const variant of allVariants) {
    if (!variant.imageUrl) continue;
    
    const currentFilename = variant.imageUrl.split('/').pop() || '';
    const suggestedFilename = generateSeoFilename(
      variant.productName || 'product',
      variant.productSlug || 'product',
      variant.color || undefined
    );
    const suggestedUrl = variant.imageUrl.replace(currentFilename, suggestedFilename);
    
    audits.push({
      id: variant.id,
      productName: variant.productName || 'Unknown',
      slug: variant.productSlug || 'unknown',
      currentUrl: variant.imageUrl,
      currentFilename,
      suggestedFilename,
      suggestedUrl,
      color: variant.color || undefined,
      type: 'variant'
    });
    
    console.log(`Product: ${variant.productName} (${variant.color})`);
    console.log(`  Current:   ${currentFilename}`);
    console.log(`  Suggested: ${suggestedFilename}`);
    console.log('');
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total main images: ${audits.filter(a => a.type === 'main').length}`);
  console.log(`Total variant images: ${audits.filter(a => a.type === 'variant').length}`);
  console.log(`Total images to rename: ${audits.length}`);

  // Save audit to JSON file
  const fs = await import('fs/promises');
  await fs.writeFile(
    '/home/ubuntu/ecommerce_store/scripts/image-audit.json',
    JSON.stringify(audits, null, 2)
  );
  console.log('\nAudit saved to scripts/image-audit.json');
}

/**
 * Generate SEO-friendly filename
 * Format: product-name-color.jpg (lowercase, hyphens, descriptive)
 */
function generateSeoFilename(productName: string, slug: string, color?: string): string {
  // Use slug as base (already hyphenated and lowercase)
  let filename = slug;
  
  // Add color if provided
  if (color) {
    filename += `-${color.toLowerCase()}`;
  }
  
  // Add .jpg extension
  filename += '.jpg';
  
  return filename;
}

auditImages().catch(console.error);
