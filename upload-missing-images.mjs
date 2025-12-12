import { storagePut } from './server/storage.js';
import { getDb } from './server/db.js';
import { products } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';

const imageMap = [
  { slug: 'classic-pique-polo', file: '/home/ubuntu/ecommerce_store/product_images/missing/polo-black.png' },
  { slug: 'essential-joggers', file: '/home/ubuntu/ecommerce_store/product_images/missing/joggers-black.png' },
  { slug: 'signature-hoodie', file: '/home/ubuntu/ecommerce_store/product_images/missing/hoodie-black.png' },
  { slug: 'script-logo-cap', file: '/home/ubuntu/ecommerce_store/product_images/missing/cap-black.png' },
];

async function uploadImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  for (const item of imageMap) {
    try {
      // Read image file
      const imageBuffer = readFileSync(item.file);
      
      // Upload to S3
      const fileName = item.file.split('/').pop();
      const s3Key = `products/${Date.now()}-${fileName}`;
      const { url } = await storagePut(s3Key, imageBuffer, 'image/png');
      
      // Update database
      await db.update(products)
        .set({ imageUrl: url })
        .where(eq(products.slug, item.slug));
      
      console.log(`✓ Uploaded image for ${item.slug}: ${url}`);
    } catch (error) {
      console.error(`✗ Failed to upload ${item.slug}:`, error.message);
    }
  }
  
  console.log('\nAll missing images uploaded!');
  process.exit(0);
}

uploadImages();
