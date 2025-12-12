import { storagePut } from './server/storage.js';
import { getDb } from './server/db.js';
import { products } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';

const imageMapping = [
  // Slogan tees
  { name: "It's all Fake Tee", path: '/home/ubuntu/ecommerce_store/product_images/slogan-its-all-fake-black.png' },
  { name: "It's all Fake Tee", path: '/home/ubuntu/ecommerce_store/product_images/slogan-its-all-fake-white.png' },
  { name: "Fake is not Hate Tee", path: '/home/ubuntu/ecommerce_store/product_images/slogan-not-hate-navy.png' },
  { name: "Live Life. Stay Fake. Tee", path: '/home/ubuntu/ecommerce_store/product_images/slogan-stay-fake-red.png' },
  { name: "Live Life. Stay Fake. Tee", path: '/home/ubuntu/ecommerce_store/product_images/slogan-stay-fake-black.png' },
  
  // Logo tees
  { name: "Fake It Classic Tee", path: '/home/ubuntu/ecommerce_store/product_images/logo-tee-black-mannequin.png' },
  { name: "Till You Make It Tee", path: '/home/ubuntu/ecommerce_store/product_images/logo-tee-white-mannequin.png' },
  { name: "Confidence Tee", path: '/home/ubuntu/ecommerce_store/product_images/logo-tee-navy-mannequin.png' },
  
  // Office shirts
  { name: "White Oxford Shirt", path: '/home/ubuntu/ecommerce_store/product_images/oxford-white-mannequin.png' },
  { name: "Light Blue Oxford Shirt", path: '/home/ubuntu/ecommerce_store/product_images/oxford-lightblue-mannequin.png' },
  { name: "Heritage Chambray Shirt", path: '/home/ubuntu/ecommerce_store/product_images/chambray-blue-mannequin.png' },
  { name: "Indigo Chambray Shirt", path: '/home/ubuntu/ecommerce_store/product_images/chambray-indigo-mannequin.png' },
];

async function uploadImages() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Starting image upload...');

  for (const item of imageMapping) {
    try {
      // Read image file
      const imageBuffer = readFileSync(item.path);
      const ext = item.path.split('.').pop();
      const fileKey = `products/${nanoid()}.${ext}`;
      
      // Upload to S3
      console.log(`Uploading ${item.name}...`);
      const { url } = await storagePut(fileKey, imageBuffer, `image/${ext}`);
      console.log(`Uploaded: ${url}`);
      
      // Find product by name and update
      const productList = await db.select().from(products).where(eq(products.name, item.name)).limit(1);
      
      if (productList.length > 0) {
        const product = productList[0];
        await db.update(products)
          .set({ imageUrl: url })
          .where(eq(products.id, product.id));
        console.log(`Updated product: ${item.name}`);
      } else {
        console.log(`Product not found: ${item.name}`);
      }
    } catch (error) {
      console.error(`Error processing ${item.name}:`, error);
    }
  }

  console.log('Image upload complete!');
  process.exit(0);
}

uploadImages();
