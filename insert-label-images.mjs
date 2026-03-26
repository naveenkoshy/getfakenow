import { drizzle } from "drizzle-orm/mysql2";
import { productImages } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const labelData = [
  { productId: 30010, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-accessories-30010_a62cae47.png", collection: "accessories" },
  { productId: 80008, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-accessories-80008_d0479d8a.png", collection: "accessories" },
  { productId: 80009, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-accessories-80009_d225a341.png", collection: "accessories" },
  { productId: 80010, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-accessories-80010_475a94e6.png", collection: "accessories" },
  { productId: 30001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-30001_ec4b1f48.png", collection: "essential" },
  { productId: 30002, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-30002_6030c30b.png", collection: "essential" },
  { productId: 30003, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-30003_c61583e7.png", collection: "essential" },
  { productId: 30004, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-30004_884ea9de.png", collection: "essential" },
  { productId: 30006, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-30006_146cba7d.png", collection: "essential" },
  { productId: 60001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-60001_29f39c05.png", collection: "essential" },
  { productId: 60002, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-60002_c0db8a76.png", collection: "essential" },
  { productId: 70001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-70001_8cde2ae5.png", collection: "essential" },
  { productId: 70003, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-70003_c0a6a92f.png", collection: "essential" },
  { productId: 70004, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-70004_b9e9972c.png", collection: "essential" },
  { productId: 80001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-80001_981daf9d.png", collection: "essential" },
  { productId: 80002, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-80002_88efee23.png", collection: "essential" },
  { productId: 80003, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-80003_d7d3ec2a.png", collection: "essential" },
  { productId: 80004, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-80004_575856d2.png", collection: "essential" },
  { productId: 80005, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-essential-80005_92f83f98.png", collection: "essential" },
  { productId: 150001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150001_f7b53e96.png", collection: "headline" },
  { productId: 150002, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150002_9ec11840.png", collection: "headline" },
  { productId: 150003, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150003_38b43b6d.png", collection: "headline" },
  { productId: 150004, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150004_15ffd6ad.png", collection: "headline" },
  { productId: 150005, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150005_6c2c224f.png", collection: "headline" },
  { productId: 150006, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150006_0b750226.png", collection: "headline" },
  { productId: 150007, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150007_c1237f75.png", collection: "headline" },
  { productId: 150008, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150008_37b28e1f.png", collection: "headline" },
  { productId: 150009, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150009_f426ed82.png", collection: "headline" },
  { productId: 150010, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150010_1a799b75.png", collection: "headline" },
  { productId: 150011, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150011_97d29a63.png", collection: "headline" },
  { productId: 150012, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150012_a90f72cf.png", collection: "headline" },
  { productId: 150013, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150013_6a4c47ff.png", collection: "headline" },
  { productId: 150014, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150014_e59b0710.png", collection: "headline" },
  { productId: 150015, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150015_41df6868.png", collection: "headline" },
  { productId: 150016, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150016_7bbb589d.png", collection: "headline" },
  { productId: 150017, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150017_42a0333e.png", collection: "headline" },
  { productId: 150018, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150018_74979152.png", collection: "headline" },
  { productId: 150019, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150019_c1f150e3.png", collection: "headline" },
  { productId: 150020, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-headline-150020_f9247b68.png", collection: "headline" },
  { productId: 30007, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-30007_8c44a758.png", collection: "professional" },
  { productId: 30008, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-30008_577d8362.png", collection: "professional" },
  { productId: 30009, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-30009_bde9ee9c.png", collection: "professional" },
  { productId: 60005, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-60005_d1e2cc1e.png", collection: "professional" },
  { productId: 60006, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-60006_2b760812.png", collection: "professional" },
  { productId: 80006, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-80006_815cb372.png", collection: "professional" },
  { productId: 80007, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-professional-80007_cfeccecc.png", collection: "professional" },
  { productId: 150021, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150021_9dabc186.png", collection: "women" },
  { productId: 150022, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150022_0697b486.png", collection: "women" },
  { productId: 150023, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150023_eb09e0d4.png", collection: "women" },
  { productId: 150024, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150024_09104a7a.png", collection: "women" },
  { productId: 150025, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150025_c4edc029.png", collection: "women" },
  { productId: 150026, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150026_6012a67e.png", collection: "women" },
  { productId: 150027, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150027_ea56ca42.png", collection: "women" },
  { productId: 150028, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150028_32ec157a.png", collection: "women" },
  { productId: 150029, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150029_ca4f500f.png", collection: "women" },
  { productId: 150030, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-150030_6af3d518.png", collection: "women" },
  { productId: 90001, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90001_5cf69c75.png", collection: "women" },
  { productId: 90002, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90002_1216b8a2.png", collection: "women" },
  { productId: 90003, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90003_fa8d0e7d.png", collection: "women" },
  { productId: 90004, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90004_299b2798.png", collection: "women" },
  { productId: 90005, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90005_37c903f0.png", collection: "women" },
  { productId: 90006, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90006_17cec1e0.png", collection: "women" },
  { productId: 90007, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90007_09b1414d.png", collection: "women" },
  { productId: 90008, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90008_19f8faa7.png", collection: "women" },
  { productId: 90009, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90009_1866752e.png", collection: "women" },
  { productId: 90010, url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663244348328/mnC6672QxsyxZGLVMrqTHR/label-women-90010_c6a7921d.png", collection: "women" },
];

async function main() {
  let inserted = 0;
  let failed = 0;
  for (const item of labelData) {
    try {
      await db.insert(productImages).values({
        productId: item.productId,
        imageUrl: item.url,
        fileKey: `label-${item.collection}-${item.productId}`,
        color: "label",
        sortOrder: 99,
      });
      inserted++;
    } catch (err) {
      console.error(`Failed for product ${item.productId}: ${err.message}`);
      failed++;
    }
  }
  console.log(`Inserted: ${inserted}, Failed: ${failed}`);
  process.exit(0);
}
main();
