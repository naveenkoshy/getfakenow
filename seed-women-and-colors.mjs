import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { products, productImages } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR";
const WOMEN_ID = 30004;

// ===== 10 NEW WOMEN'S PRODUCTS: 5 Skirts + 5 Blouses =====
const womenProducts = [
  // SKIRTS
  {
    name: "The Silhouette",
    slug: "the-silhouette",
    description: `A-line midi skirt that moves like it knows where it's going. Mid-calf length, slightly flared, the kind of piece that works with sneakers or heels depending on who you're pretending to be today.\n\nMATERIALS:\n65% cotton, 35% polyester blend\nMid-weight structured fabric\nElasticized waistband with hidden zip\nFully lined\nSubtle FAKE embroidered tag on waistband\n\nCARE:\nMachine wash cold, gentle cycle\nHang dry recommended\nLow iron if needed\nDo not bleach`,
    price: 6900,
    categoryId: WOMEN_ID,
    stockQuantity: 80,
    featured: true,
    active: true,
    imageUrl: `${CDN}/the-silhouette_0134c1ea.webp`,
  },
  {
    name: "The Pencil",
    slug: "the-pencil-skirt",
    description: `Knee-length pencil skirt in charcoal gray. Fitted without being restrictive, with a small back slit that says 'I have places to be.' Semi-formal enough for the office, relaxed enough for everything after.\n\nMATERIALS:\n70% polyester, 25% viscose, 5% elastane\nStructured mid-weight fabric\nConcealed back zip\nBack slit for movement\nFully lined\n\nCARE:\nDry clean recommended\nOr hand wash cold\nHang dry\nLow iron on reverse`,
    price: 7900,
    categoryId: WOMEN_ID,
    stockQuantity: 60,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-pencil_04308f68.webp`,
  },
  {
    name: "The Wrap Skirt",
    slug: "the-wrap-skirt",
    description: `Mid-length wrap skirt in olive. Tied at the waist, relaxed drape, the intersection of streetwear and casual elegance. One of those pieces that looks effortless but you know exactly what you're doing.\n\nMATERIALS:\n100% cotton twill\nMid-weight with natural drape\nSelf-tie waist closure\nSide pockets\nFAKE woven label on inner waist\n\nCARE:\nMachine wash cold\nTumble dry low\nIron on medium if needed\nDo not bleach`,
    price: 6500,
    categoryId: WOMEN_ID,
    stockQuantity: 70,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-wrap_12d9a335.webp`,
  },
  {
    name: "The Pleat",
    slug: "the-pleat",
    description: `Box-pleated mini skirt in navy. Sits above the knee, structured enough to hold its shape, relaxed enough to not care. Youthful without trying too hard.\n\nMATERIALS:\n80% polyester, 20% cotton\nStructured pleated fabric\nConcealed side zip\nFully lined\nFAKE tag on hem\n\nCARE:\nMachine wash cold, gentle cycle\nHang dry to preserve pleats\nSteam rather than iron\nDo not bleach`,
    price: 5900,
    categoryId: WOMEN_ID,
    stockQuantity: 75,
    featured: true,
    active: true,
    imageUrl: `${CDN}/the-pleat_e5c05b46.webp`,
  },
  {
    name: "The Highrise",
    slug: "the-highrise",
    description: `High-waisted A-line skirt in burgundy. Knee-length, structured, polished. The kind of skirt that makes people think you have your life together. You don't, but the skirt doesn't need to know that.\n\nMATERIALS:\n75% polyester, 20% viscose, 5% elastane\nStructured fabric with polished finish\nHigh waistband with concealed zip\nFully lined\nSubtle inner label branding\n\nCARE:\nDry clean recommended\nOr hand wash cold\nHang dry\nLow iron on reverse`,
    price: 7500,
    categoryId: WOMEN_ID,
    stockQuantity: 55,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-highrise_cba2fa50.webp`,
  },
  // BLOUSES
  {
    name: "The Oversized",
    slug: "the-oversized-blouse",
    description: `Oversized button-front blouse in white. Dropped shoulders, collar, relaxed fit. Clean minimalist design with a small FAKE embroidery on the chest pocket. The shirt that says 'I woke up like this' even when you spent 40 minutes getting ready.\n\nMATERIALS:\n100% premium cotton poplin\nRelaxed oversized fit\nButton-front closure\nChest pocket with FAKE embroidery\nCurved hem\n\nCARE:\nMachine wash cold\nTumble dry low\nIron on medium\nDo not bleach`,
    price: 6900,
    categoryId: WOMEN_ID,
    stockQuantity: 85,
    featured: true,
    active: true,
    imageUrl: `${CDN}/the-oversized_5c365311.webp`,
  },
  {
    name: "The Mandarin Blouse",
    slug: "the-mandarin-blouse",
    description: `Fitted blouse in black with a mandarin collar. Concealed buttons, tailored fit, sleek and modern. The kind of top that works in a boardroom or a bar depending on what you pair it with.\n\nMATERIALS:\n65% cotton, 35% polyester\nTailored fitted cut\nMandarin collar\nConcealed button placket\nBrand tag at nape\n\nCARE:\nMachine wash cold, gentle cycle\nHang dry\nLow iron if needed\nDo not bleach`,
    price: 7500,
    categoryId: WOMEN_ID,
    stockQuantity: 65,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-mandarin-blouse_61182322.webp`,
  },
  {
    name: "The Linen",
    slug: "the-linen-blouse",
    description: `Relaxed boxy blouse in sand. Short sleeves, round neck, breathable linen blend. Built for heat, styled for everything else. FAKE woven label on the side seam because even summer pieces need credentials.\n\nMATERIALS:\n55% linen, 45% cotton\nRelaxed boxy fit\nShort sleeves\nRound neckline\nFAKE woven label on side seam\n\nCARE:\nMachine wash cold\nHang dry\nIron on medium while slightly damp\nExpect natural linen texture`,
    price: 5900,
    categoryId: WOMEN_ID,
    stockQuantity: 90,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-linen_4055dc80.webp`,
  },
  {
    name: "The Wrap Blouse",
    slug: "the-wrap-blouse",
    description: `V-neck wrap blouse in dusty rose. Tie at the waist, three-quarter sleeves, elegant drape. The top that transitions from desk to dinner without asking permission.\n\nMATERIALS:\n70% viscose, 30% polyester\nWrap-front with self-tie\nThree-quarter sleeves\nV-neckline\nSubtle brand tag\n\nCARE:\nHand wash cold recommended\nOr machine wash gentle cycle\nHang dry\nLow iron on reverse`,
    price: 6500,
    categoryId: WOMEN_ID,
    stockQuantity: 70,
    featured: true,
    active: true,
    imageUrl: `${CDN}/the-wrap-blouse_93f994b2.webp`,
  },
  {
    name: "The Crop Blouse",
    slug: "the-crop-blouse",
    description: `Boxy cropped blouse in cream. Cap sleeves, subtle texture, minimalist streetwear aesthetic. Pairs with everything high-waisted. FAKE tag on the hem for anyone who looks close enough.\n\nMATERIALS:\n100% cotton with textured weave\nBoxy crop fit\nCap sleeves\nRound neckline\nFAKE tag on hem\n\nCARE:\nMachine wash cold\nTumble dry low\nIron on low if needed\nDo not bleach`,
    price: 4900,
    categoryId: WOMEN_ID,
    stockQuantity: 95,
    featured: false,
    active: true,
    imageUrl: `${CDN}/the-crop-blouse_d0e5400e.webp`,
  },
];

// ===== COLOR VARIANTS =====
// We add color variant entries to productImages for ALL existing products
// Each product gets at minimum 3 colors: the existing one + white + navy
// The productImages.color field drives the color swatches on the product detail page

async function seedAll() {
  console.log("Seeding 10 new women's products...");
  
  for (const p of womenProducts) {
    try {
      await db.insert(products).values(p);
      console.log(`  ✓ ${p.name}`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`  ⊘ ${p.name} (already exists)`);
      } else {
        console.error(`  ✗ ${p.name}: ${e.message}`);
      }
    }
  }
  
  // Now add color variants to ALL products via productImages
  // Get all product IDs and their current imageUrl
  console.log("\nAdding color variants to all products...");
  
  const allProducts = await db.select({
    id: products.id,
    name: products.name,
    imageUrl: products.imageUrl,
  }).from(products);
  
  // For each product, ensure at least 3 color entries in productImages
  const colorVariants = ['black', 'white', 'navy'];
  
  for (const p of allProducts) {
    // Check existing images for this product
    const existing = await db.select().from(productImages).where(
      eq(productImages.productId, p.id)
    );
    
    const existingColors = new Set(existing.map(e => e.color?.toLowerCase()));
    
    for (const color of colorVariants) {
      if (!existingColors.has(color)) {
        try {
          await db.insert(productImages).values({
            productId: p.id,
            imageUrl: p.imageUrl || '', // Use the main product image as placeholder
            fileKey: `${p.id}-${color}`,
            color: color,
            sortOrder: colorVariants.indexOf(color),
          });
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    console.log(`  ✓ ${p.name} — colors ensured`);
  }
  
  console.log("\nDone! Women's products and color variants seeded.");
  process.exit(0);
}

seedAll().catch(e => {
  console.error(e);
  process.exit(1);
});
