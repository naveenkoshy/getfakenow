/**
 * Rename all product images with SEO-friendly names
 * Downloads from CloudFront, renames, uploads to S3, updates database
 */
import { getDb } from '../server/db';
import { products, productImages } from '../drizzle/schema';
import { storagePut } from '../server/storage';
import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';

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

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function renameImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  // Load audit file
  const auditData = await fs.readFile(
    '/home/ubuntu/ecommerce_store/scripts/image-audit.json',
    'utf-8'
  );
  const audits: ImageAudit[] = JSON.parse(auditData);

  console.log(`\n=== RENAMING ${audits.length} IMAGES ===\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const audit of audits) {
    try {
      console.log(`Processing: ${audit.productName}${audit.color ? ` (${audit.color})` : ''}`);
      console.log(`  Downloading from: ${audit.currentUrl}`);

      // Download image
      const imageBuffer = await downloadImage(audit.currentUrl);
      console.log(`  Downloaded: ${imageBuffer.length} bytes`);

      // Upload with new name
      const newKey = `products/${audit.suggestedFilename}`;
      const { url: newUrl } = await storagePut(newKey, imageBuffer, 'image/jpeg');
      console.log(`  Uploaded to: ${newUrl}`);

      // Update database
      if (audit.type === 'main') {
        await db
          .update(products)
          .set({ imageUrl: newUrl })
          .where(eq(products.id, audit.id));
        console.log(`  Updated products table (ID: ${audit.id})`);
      } else {
        await db
          .update(productImages)
          .set({ imageUrl: newUrl })
          .where(eq(productImages.id, audit.id));
        console.log(`  Updated productImages table (ID: ${audit.id})`);
      }

      successCount++;
      console.log(`  ✓ Success\n`);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total images: ${audits.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
}

renameImages().catch(console.error);
