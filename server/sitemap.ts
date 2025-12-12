/**
 * Sitemap generation for SEO
 */
import { getDb } from './db';
import { products } from '../drizzle/schema';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate sitemap URLs for all pages
 */
export async function generateSitemapUrls(): Promise<SitemapUrl[]> {
  const baseUrl = 'https://getfakenow.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push({
    loc: baseUrl,
    changefreq: 'daily',
    priority: 1.0,
  });

  urls.push({
    loc: `${baseUrl}/shop`,
    changefreq: 'daily',
    priority: 0.9,
  });

  urls.push({
    loc: `${baseUrl}/casual`,
    changefreq: 'weekly',
    priority: 0.8,
  });

  urls.push({
    loc: `${baseUrl}/professional`,
    changefreq: 'weekly',
    priority: 0.8,
  });

  // Policy pages
  urls.push({
    loc: `${baseUrl}/privacy-policy`,
    changefreq: 'monthly',
    priority: 0.3,
  });

  urls.push({
    loc: `${baseUrl}/shipping-policy`,
    changefreq: 'monthly',
    priority: 0.3,
  });

  urls.push({
    loc: `${baseUrl}/returns-policy`,
    changefreq: 'monthly',
    priority: 0.3,
  });

  urls.push({
    loc: `${baseUrl}/terms-of-service`,
    changefreq: 'monthly',
    priority: 0.3,
  });

  // Product pages - fetch from database
  const db = await getDb();
  if (!db) {
    console.warn('[Sitemap] Database not available');
    return urls;
  }

  const allProducts = await db.select({
    slug: products.slug,
    updatedAt: products.updatedAt,
  }).from(products);

  for (const product of allProducts) {
    urls.push({
      loc: `${baseUrl}/product/${product.slug}`,
      lastmod: product.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.7,
    });
  }

  return urls;
}

/**
 * Generate XML sitemap string
 */
export async function generateSitemapXml(): Promise<string> {
  const urls = await generateSitemapUrls();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
