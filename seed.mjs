import { drizzle } from "drizzle-orm/mysql2";
import { categories, products } from "./drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert categories
  const categoryData = [
    {
      name: "Electronics",
      slug: "electronics",
      description: "Latest gadgets and electronic devices",
      imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop",
    },
    {
      name: "Fashion",
      slug: "fashion",
      description: "Trendy clothing and accessories",
      imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop",
    },
    {
      name: "Home & Living",
      slug: "home-living",
      description: "Beautiful items for your home",
      imageUrl: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&auto=format&fit=crop",
    },
    {
      name: "Books",
      slug: "books",
      description: "Discover your next great read",
      imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop",
    },
    {
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Gear for active lifestyles",
      imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop",
    },
  ];

  await db.insert(categories).values(categoryData);
  console.log("✅ Categories seeded");

  // Insert products
  const productData = [
    // Electronics
    {
      name: "Wireless Headphones Pro",
      slug: "wireless-headphones-pro",
      description: "Premium noise-cancelling wireless headphones with 30-hour battery life and superior sound quality.",
      price: 29999, // $299.99
      categoryId: 1,
      stockQuantity: 50,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
      featured: true,
      active: true,
    },
    {
      name: "Smart Watch Ultra",
      slug: "smart-watch-ultra",
      description: "Advanced fitness tracking, heart rate monitoring, and smartphone notifications on your wrist.",
      price: 39999, // $399.99
      categoryId: 1,
      stockQuantity: 35,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop",
      featured: true,
      active: true,
    },
    {
      name: "4K Webcam",
      slug: "4k-webcam",
      description: "Crystal clear 4K video quality for professional video calls and streaming.",
      price: 12999, // $129.99
      categoryId: 1,
      stockQuantity: 75,
      imageUrl: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    // Fashion
    {
      name: "Classic Leather Jacket",
      slug: "classic-leather-jacket",
      description: "Timeless leather jacket crafted from premium materials for lasting style.",
      price: 24999, // $249.99
      categoryId: 2,
      stockQuantity: 25,
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop",
      featured: true,
      active: true,
    },
    {
      name: "Designer Sunglasses",
      slug: "designer-sunglasses",
      description: "Elegant sunglasses with UV protection and sophisticated design.",
      price: 15999, // $159.99
      categoryId: 2,
      stockQuantity: 60,
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-tshirt",
      description: "Soft, breathable cotton t-shirt in multiple colors. Perfect for everyday wear.",
      price: 2999, // $29.99
      categoryId: 2,
      stockQuantity: 150,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    // Home & Living
    {
      name: "Minimalist Table Lamp",
      slug: "minimalist-table-lamp",
      description: "Elegant table lamp with adjustable brightness and modern design.",
      price: 7999, // $79.99
      categoryId: 3,
      stockQuantity: 40,
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
      featured: true,
      active: true,
    },
    {
      name: "Ceramic Vase Set",
      slug: "ceramic-vase-set",
      description: "Handcrafted ceramic vases in three sizes. Perfect for fresh or dried flowers.",
      price: 4999, // $49.99
      categoryId: 3,
      stockQuantity: 30,
      imageUrl: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    // Books
    {
      name: "The Art of Programming",
      slug: "art-of-programming",
      description: "Comprehensive guide to modern software development practices and patterns.",
      price: 4599, // $45.99
      categoryId: 4,
      stockQuantity: 100,
      imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    {
      name: "Mindfulness & Meditation",
      slug: "mindfulness-meditation",
      description: "Practical guide to incorporating mindfulness into your daily routine.",
      price: 1999, // $19.99
      categoryId: 4,
      stockQuantity: 80,
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
    // Sports & Outdoors
    {
      name: "Yoga Mat Pro",
      slug: "yoga-mat-pro",
      description: "Extra-thick, non-slip yoga mat with carrying strap. Perfect for all practice levels.",
      price: 5999, // $59.99
      categoryId: 5,
      stockQuantity: 65,
      imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop",
      featured: true,
      active: true,
    },
    {
      name: "Stainless Steel Water Bottle",
      slug: "stainless-steel-water-bottle",
      description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.",
      price: 3499, // $34.99
      categoryId: 5,
      stockQuantity: 120,
      imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop",
      featured: false,
      active: true,
    },
  ];

  await db.insert(products).values(productData);
  console.log("✅ Products seeded");

  console.log("🎉 Database seeding completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
