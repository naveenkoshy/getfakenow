import { drizzle } from "drizzle-orm/mysql2";
import { categories, products } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database...");

  await db.delete(products);
  await db.delete(categories);

  const [casualResult] = await db.insert(categories).values({
    name: "Casual",
    slug: "casual",
    description: "Everyday essentials with attitude",
  });

  const [professionalResult] = await db.insert(categories).values({
    name: "Professional",
    slug: "professional",
    description: "Refined workwear for the modern professional",
  });

  const [accessoriesResult] = await db.insert(categories).values({
    name: "Accessories",
    slug: "accessories",
    description: "Complete your look",
  });

  const casualId = casualResult.insertId;
  const professionalId = professionalResult.insertId;
  const accessoriesId = accessoriesResult.insertId;

  const productsData = [
    {
      name: "Fake It Classic Tee",
      slug: "fake-it-classic-tee",
      description: "Our signature graphic tee featuring the iconic 'Fake' script in bold red. Premium 100% cotton with a relaxed fit.",
      price: 3500,
      categoryId: casualId,
      stockQuantity: 50,
      featured: true,
      active: true,
    },
    {
      name: "Till You Make It Tee",
      slug: "till-you-make-it-tee",
      description: "Witty one-liner meets premium comfort. Soft cotton blend with the full slogan.",
      price: 3500,
      categoryId: casualId,
      stockQuantity: 45,
      featured: true,
      active: true,
    },
    {
      name: "Confidence Tee",
      slug: "confidence-tee",
      description: "Bold statement piece with 'Fake Confidence' graphic. Heavyweight cotton construction.",
      price: 3800,
      categoryId: casualId,
      stockQuantity: 40,
      featured: false,
      active: true,
    },
    {
      name: "Fake Signature Hoodie",
      slug: "fake-signature-hoodie",
      description: "Premium heavyweight hoodie with embroidered logo. Brushed fleece interior, adjustable drawstrings.",
      price: 6500,
      categoryId: casualId,
      stockQuantity: 35,
      featured: true,
      active: true,
    },
    {
      name: "Essential Joggers",
      slug: "essential-joggers",
      description: "Tailored joggers in premium cotton terry. Tapered fit with elastic waistband and cuffs.",
      price: 5500,
      categoryId: casualId,
      stockQuantity: 40,
      featured: true,
      active: true,
    },
    {
      name: "Classic Pique Polo",
      slug: "classic-pique-polo",
      description: "Timeless polo shirt in premium pique cotton. Three-button placket and ribbed collar.",
      price: 4500,
      categoryId: casualId,
      stockQuantity: 50,
      featured: false,
      active: true,
    },
    {
      name: "White Oxford Shirt",
      slug: "white-oxford-shirt",
      description: "Essential white oxford in premium cotton. Button-down collar, chest pocket, tailored fit.",
      price: 7500,
      categoryId: professionalId,
      stockQuantity: 40,
      featured: true,
      active: true,
    },
    {
      name: "Light Blue Oxford",
      slug: "light-blue-oxford",
      description: "Classic light blue oxford shirt. Non-iron cotton blend for easy care.",
      price: 7500,
      categoryId: professionalId,
      stockQuantity: 38,
      featured: true,
      active: true,
    },
    {
      name: "Classic Chambray Work Shirt",
      slug: "classic-chambray-work-shirt",
      description: "Heritage-inspired chambray shirt in lightweight denim. Chest pockets and pearl snap buttons.",
      price: 6800,
      categoryId: professionalId,
      stockQuantity: 42,
      featured: true,
      active: true,
    },
    {
      name: "Fake Script Cap",
      slug: "fake-script-cap",
      description: "Classic six-panel cap with embroidered script. Adjustable strap, curved brim.",
      price: 2800,
      categoryId: accessoriesId,
      stockQuantity: 80,
      featured: false,
      active: true,
    },
  ];

  await db.insert(products).values(productsData);

  console.log("✅ Database seeded!");
  console.log(`- ${productsData.length} products added`);
}

seed().catch(console.error).finally(() => process.exit(0));
