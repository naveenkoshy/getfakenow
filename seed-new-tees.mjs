import { drizzle } from "drizzle-orm/mysql2";
import { products } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR";

// Category ID for Casual (Printed Tees) = 30001
const CASUAL_ID = 30001;

const newTees = [
  // ===== BATCH 1: Ironic Classics =====
  {
    name: "Trust Me, I'm Fake",
    slug: "trust-me-im-fake",
    description: `Classic confidence meets total transparency. The kind of shirt that makes strangers trust you less and respect you more. Wear it to meetings, dates, or anywhere honesty is overrated.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/trust-me-im-fake_63dd6728.webp`,
  },
  {
    name: "Authentically Fake Since 2026",
    slug: "authentically-fake-since-2026",
    description: `The founding myth, printed. Born in 2026, built on the radical idea that admitting you're fake is the most real thing you can do. This is the origin story tee.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/authentically-fake-since-2026_5d56d55a.webp`,
  },
  {
    name: "My Other Shirt Is Also Fake",
    slug: "my-other-shirt-is-also-fake",
    description: `For the loyal repeat buyer who's all in. A nod to the bumper sticker energy of the '90s, updated for people who own multiple Fake by Freetown pieces and aren't sorry about it.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/my-other-shirt-is-also-fake_59792a27.webp`,
  },
  {
    name: "Fake News, Real Drip",
    slug: "fake-news-real-drip",
    description: `Timely, punchy, unapologetic. The headline everyone's tired of, flipped into something you'd actually want to wear. The drip is verifiable. The news is not.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/fake-news-real-drip_14f4606e.webp`,
  },
  {
    name: "The Fake Life Had Better Fabric",
    slug: "fake-life-better-fabric",
    description: `Long-form wit for the back print crowd. You didn't choose the fake life — the fake life had better fabric, better fit, and better vibes. This is the manifesto tee.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nOversized drop-shoulder fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 5400,
    categoryId: CASUAL_ID,
    stockQuantity: 80,
    featured: false,
    active: true,
    imageUrl: `${CDN}/fake-life-better-fabric_b2c5ccb2.webp`,
  },
  {
    name: "100% Genuine Fake",
    slug: "100-percent-genuine-fake",
    description: `The paradox that sells itself. A certified contradiction in terms, printed on the best cotton money can buy. If the label says genuine fake, who are you to argue?\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/100-percent-genuine-fake_85ae2bdf.webp`,
  },
  {
    name: "Fake It Till You Make It (I Made It)",
    slug: "fake-it-till-you-make-it",
    description: `Aspirational irony at its peak. The hustle culture mantra, completed. You faked it. You made it. Now you're wearing the proof. Congratulations, you earned this tee.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/fake-it-till-you-make-it_67f82441.webp`,
  },
  {
    name: "Not Real. Not Sorry.",
    slug: "not-real-not-sorry",
    description: `Short, bold, zero apologies. Four words. Two sentences. One attitude. The minimalist's statement tee for people who don't owe anyone an explanation.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/not-real-not-sorry_bd1f077e.webp`,
  },
  {
    name: "Traces of Authenticity",
    slug: "traces-of-authenticity",
    description: `Mock disclaimer energy. "WARNING: May Contain Traces of Authenticity." Like a nutrition label for your personality. Side effects may include compliments, confused looks, and new friends.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/traces-of-authenticity_71ead9c4.webp`,
  },
  {
    name: "Read the Label",
    slug: "read-the-label",
    description: `Philosophical streetwear. "Everyone's Real Until You Read the Label." The tee that makes people check their own tags. Deep enough for a thesis, casual enough for brunch.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/read-the-label_66dbcb13.webp`,
  },

  // ===== BATCH 2: Gen Z Collection =====
  {
    name: "No Cap, All Fake",
    slug: "no-cap-all-fake",
    description: `The ultimate contradiction. No cap means no lies — but it's all fake. Gen Z gets it. Your parents won't. That's the point. The internet's favorite paradox, now in cotton.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/no-cap-all-fake_8a34933e.webp`,
  },
  {
    name: "Situationship Shirt",
    slug: "situationship-shirt",
    description: `Undefined, uncommitted, unreturnable. "This Is My Situationship Shirt." For the relationship status that doesn't have a Facebook option. It's complicated. The shirt isn't.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/situationship-shirt_377c1dbe.webp`,
  },
  {
    name: "Delulu Is the Solulu",
    slug: "delulu-is-the-solulu",
    description: `Delusional optimism as a lifestyle brand. If being delulu is the solution, then this tee is the prescription. Clinically unproven. Spiritually essential. TikTok-approved.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/delulu-is-the-solulu_0cc1dd70.webp`,
  },
  {
    name: "Fake Personality, Real Fit",
    slug: "fake-personality-real-fit",
    description: `At least the outfit isn't lying. Your personality might be a work in progress, but the fit? The fit is undeniable. Priorities, people.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/fake-personality-real-fit_c4a72913.webp`,
  },
  {
    name: "Giving Fake (And I'm Okay With That)",
    slug: "giving-fake-okay-with-that",
    description: `Self-awareness as a flex. "I'm Giving Fake And I'm Okay With That." The radical acceptance tee. Therapy is expensive. This shirt is RM49. You do the math.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/giving-fake-okay-with-that_dbc3444c.webp`,
  },
  {
    name: "Main Character Energy",
    slug: "main-character-energy",
    description: `The vibes are expensive, the bank account isn't. "Main Character Energy (Background Extra Budget)." For everyone living their protagonist arc on a supporting cast salary.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nOversized drop-shoulder fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 5400,
    categoryId: CASUAL_ID,
    stockQuantity: 80,
    featured: true,
    active: true,
    imageUrl: `${CDN}/main-character-energy_3b0c6699.webp`,
  },
  {
    name: "POV: Fake Shirt On Purpose",
    slug: "pov-fake-shirt-on-purpose",
    description: `Breaking the fourth wall of fashion. "POV: You Bought a Fake Shirt On Purpose." The meta tee that narrates its own existence. You're not a victim of marketing. You ARE the marketing.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/pov-fake-shirt-on-purpose_473d3e00.webp`,
  },
  {
    name: "Giving Absolutely Nothing",
    slug: "giving-absolutely-nothing",
    description: `Anti-fashion fashion. "It's Giving... Absolutely Nothing (And That's the Point)." The deliberate nothingness tee. In a world of maximalism, this is your minimalist rebellion.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/giving-absolutely-nothing_20c8313b.webp`,
  },
  {
    name: "Rent Free, Full Price",
    slug: "rent-free-full-price",
    description: `Living in someone's mind, paying retail. "Rent Free in Your Head, Full Price on My Back." The duality of modern existence — priceless in their thoughts, RM49 on the hanger.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: false,
    active: true,
    imageUrl: `${CDN}/rent-free-full-price_b3f1635f.webp`,
  },
  {
    name: "Understood the Assignment",
    slug: "understood-the-assignment",
    description: `Aced the test that didn't exist. "Understood the Assignment (The Assignment Was Fake)." For overachievers who excel at things that don't matter. Dean's list energy, dropout vibes.\n\nMATERIALS:\n100% premium combed cotton\n220 GSM heavyweight jersey\nRibbed crew neck\nDouble-stitched hems\nPre-shrunk fabric\nRelaxed unisex fit\n\nCARE:\nMachine wash cold, inside out\nTumble dry low\nDo not bleach\nIron on reverse side if needed\nDTG print — won't crack, peel, or fade`,
    price: 4900,
    categoryId: CASUAL_ID,
    stockQuantity: 100,
    featured: true,
    active: true,
    imageUrl: `${CDN}/understood-the-assignment_bfcbd135.webp`,
  },
];

async function seedNewTees() {
  console.log("Seeding 20 new printed tees...");
  
  for (const tee of newTees) {
    try {
      await db.insert(products).values(tee);
      console.log(`  ✓ ${tee.name}`);
    } catch (error) {
      if (error.message?.includes("Duplicate")) {
        console.log(`  ⚠ ${tee.name} (already exists, skipping)`);
      } else {
        console.error(`  ✗ ${tee.name}: ${error.message}`);
      }
    }
  }
  
  console.log("\nDone! 20 new tees seeded.");
  process.exit(0);
}

seedNewTees();
