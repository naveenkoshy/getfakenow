import { getDb } from './server/db.js';
import { products, productImages } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Map existing uploaded images to products and colors
const variantMappings = [
  // Slogan tees
  { productName: "It's all Fake Tee", color: "black", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/KTPd3q5hvjdDc0oQCYV19.png" },
  { productName: "Fake is not Hate Tee", color: "navy", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/0IiAnD9ZgdigYsyZDhPpr.png" },
  { productName: "Live Life. Stay Fake. Tee", color: "red", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/ApIvzMTVZovLWVqHhWpGD.png" },
  
  // Logo tees
  { productName: "Fake It Classic Tee", color: "black", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/N_-UMlVn8AL9NsivVoSxF.png" },
  { productName: "Till You Make It Tee", color: "white", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/mnB5KTGrdQN6CD_YYngmo.png" },
  { productName: "Confidence Tee", color: "navy", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/WixAtW8s8xyMtDLoOflXk.png" },
  
  // Office shirts
  { productName: "White Oxford Shirt", color: "white", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/-UPthWscnsgkMGOtlSLxB.png" },
  { productName: "Light Blue Oxford", color: "white", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/POFnwXJYf3K-DSyrAyezv.png" },
  { productName: "Heritage Chambray", color: "navy", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/ENJGHnPUKjC54bQXSzR_h.png" },
  { productName: "Indigo Chambray", color: "navy", imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/products/H1ikEAerRnyR8s6g3Ru8-.png" },
];

async function mapVariants() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Mapping variant images to products...');

  for (const mapping of variantMappings) {
    try {
      // Find product
      const productList = await db.select().from(products).where(eq(products.name, mapping.productName)).limit(1);
      
      if (productList.length === 0) {
        console.log(`Product not found: ${mapping.productName}`);
        continue;
      }
      
      const product = productList[0];
      
      // Extract fileKey from URL
      const urlParts = mapping.imageUrl.split('/');
      const fileKey = `products/${urlParts[urlParts.length - 1]}`;
      
      // Insert product image with color
      await db.insert(productImages).values({
        productId: product.id,
        imageUrl: mapping.imageUrl,
        fileKey: fileKey,
        color: mapping.color,
        sortOrder: 0,
      });
      
      console.log(`Mapped ${mapping.color} variant for ${mapping.productName}`);
    } catch (error) {
      console.error(`Error mapping ${mapping.productName}:`, error);
    }
  }

  console.log('Variant mapping complete!');
  process.exit(0);
}

mapVariants();
