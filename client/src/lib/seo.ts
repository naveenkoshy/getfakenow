/**
 * SEO utility functions for meta tags and structured data
 */

export interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  sku?: string;
}

/**
 * Generate page title with brand suffix
 */
export function generateTitle(pageTitle: string): string {
  const brandName = 'Fake by Freetown';
  if (pageTitle === brandName) return pageTitle;
  return `${pageTitle} | ${brandName}`;
}

/**
 * Update document meta tags for SEO
 */
export function updateMetaTags(config: SEOConfig): void {
  const {
    title,
    description,
    image = 'https://fake-store-images.s3.ap-southeast-1.amazonaws.com/fake-logo-red.png',
    url = window.location.href,
    type = 'website',
  } = config;

  // Update document title
  document.title = generateTitle(title);

  // Update or create meta tags
  updateMetaTag('description', description);
  
  // Open Graph tags
  updateMetaTag('og:title', generateTitle(title), 'property');
  updateMetaTag('og:description', description, 'property');
  updateMetaTag('og:image', image, 'property');
  updateMetaTag('og:url', url, 'property');
  updateMetaTag('og:type', type, 'property');
  updateMetaTag('og:site_name', 'Fake by Freetown', 'property');
  
  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', generateTitle(title));
  updateMetaTag('twitter:description', description);
  updateMetaTag('twitter:image', image);
  
  // Canonical URL
  updateLinkTag('canonical', url);
}

/**
 * Helper to update or create a meta tag
 */
function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name'): void {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
}

/**
 * Helper to update or create a link tag
 */
function updateLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  
  element.href = href;
}

/**
 * Generate Product structured data (JSON-LD)
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  brand: string;
  sku: string;
  url: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: `https://schema.org/${
        product.availability === 'in stock'
          ? 'InStock'
          : product.availability === 'out of stock'
          ? 'OutOfStock'
          : 'PreOrder'
      }`,
      url: product.url,
      seller: {
        '@type': 'Organization',
        name: 'Fake by Freetown',
      },
    },
  };

  return JSON.stringify(schema);
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fake by Freetown',
    alternateName: 'Fake',
    url: 'https://getfakenow.com',
    logo: 'https://fake-store-images.s3.ap-southeast-1.amazonaws.com/fake-logo-red.png',
    description: 'Malaysian apparel brand offering quality streetwear and professional workwear. Made to last, designed to move.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MY',
      addressLocality: 'Malaysia',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      areaServed: 'MY',
      availableLanguage: ['English', 'Malay'],
    },
  };

  return JSON.stringify(schema);
}

/**
 * Generate Breadcrumb structured data (JSON-LD)
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return JSON.stringify(schema);
}

/**
 * Generate WebSite structured data (JSON-LD) with search functionality
 */
export function generateWebSiteSchema(): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fake by Freetown',
    url: 'https://getfakenow.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://getfakenow.com/shop?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return JSON.stringify(schema);
}

/**
 * Inject structured data script into document head
 */
export function injectStructuredData(jsonLd: string, id?: string): void {
  // Remove existing script if ID provided
  if (id) {
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  if (id) script.id = id;
  script.textContent = jsonLd;
  document.head.appendChild(script);
}

/**
 * Remove structured data script from document head
 */
export function removeStructuredData(id: string): void {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}
