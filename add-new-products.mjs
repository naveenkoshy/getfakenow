import { storagePut } from './server/storage.js';
import { getDb } from './server/db.js';
import { products, categories } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { nanoid } from 'nanoid';

const newProducts = [
  {
    name: "It's all Fake Tee",
    description: "Premium cotton tee with bold statement. 100% cotton, regular fit.",
    price: 3500,
    stock: 50,
    categoryName: "Casual",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/slogan-its-all-fake-black.png'
  },
  {
    name: "Fake is not Hate Tee",
    description: "Spread positivity. Premium cotton, comfortable fit.",
    price: 3500,
    stock: 50,
    categoryName: "Casual",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/slogan-not-hate-navy.png'
  },
  {
    name: "Live Life. Stay Fake. Tee",
    description: "Live authentic. Premium cotton tee with attitude.",
    price: 3500,
    stock: 50,
    categoryName: "Casual",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/slogan-stay-fake-red.png'
  },
  {
    name: "Light Blue Oxford",
    description: "Classic light blue oxford button-down. Professional workwear essential.",
    price: 6500,
    stock: 30,
    categoryName: "Professional",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/oxford-lightblue-mannequin.png'
  },
  {
    name: "Heritage Chambray",
    description: "Medium blue chambray work shirt. Durable cotton construction.",
    price: 7500,
    stock: 25,
    categoryName: "Professional",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/chambray-blue-mannequin.png'
  },
  {
    name: "Indigo Chambray",
    description: "Dark indigo chambray shirt. Heritage workwear styling.",
    price: 7500,
    stock: 25,
    categoryName: "Professional",
    imagePath: '/home/ubuntu/ecommerce_store/product_images/chambray-indigo-mannequin.png'
  },
];

async function addProducts() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Adding new products...');

  for (const item of newProducts) {
    try {
      // Upload image to S3
      const imageBuffer = readFileSync(item.imagePath);
      const ext = item.imagePath.split('.').pop();
      const fileKey = `products/${nanoid()}.${ext}`;
      
      console.log(`Uploading image for ${item.name}...`);
      const { url } = await storagePut(fileKey, imageBuffer, `image/${ext}`);
      console.log(`Uploaded: ${url}`);
      
      // Get category ID
      const categoryList = await db.select().from(categories).where(eq(categories.name, item.categoryName)).limit(1);
      
      if (categoryList.length === 0) {
        console.log(`Category not found: ${item.categoryName}`);
        continue;
      }
      
      const category = categoryList[0];
      
      // Insert product
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await db.insert(products).values({
        name: item.name,
        slug: slug,
        description: item.description,
        price: item.price,
        stockQuantity: item.stock,
        categoryId: category.id,
        imageUrl: url,
      });
      
      console.log(`Added product: ${item.name}`);
    } catch (error) {
      console.error(`Error adding ${item.name}:`, error);
    }
  }

  console.log('Products added successfully!');
  process.exit(0);
}

addProducts();
