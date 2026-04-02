/**
 * Page Block Types — Shared type definitions for the visual page builder.
 *
 * Each page stores its content as a JSON array of PageBlock objects
 * in the `blocksJson` column. Block types are discriminated by the
 * `type` field, and each type carries its own `props` shape.
 */

export interface HeroBlockProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
}

export interface TextBlockProps {
  /** Tiptap HTML content */
  content: string;
}

export interface ImageBlockProps {
  imageUrl: string;
  altText?: string;
  caption?: string;
  width?: "full" | "contained" | "small";
  linkUrl?: string;
}

export interface ProductGridBlockProps {
  title?: string;
  categoryId?: number;
  productIds?: number[];
  columns?: 2 | 3 | 4;
  limit?: number;
}

export interface CtaBlockProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  bgColor?: string;
  textColor?: string;
  alignment?: "left" | "center";
}

export interface VideoBlockProps {
  url: string;
  caption?: string;
  autoplay?: boolean;
}

export interface TestimonialBlockProps {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
  rating?: number;
}

export interface FaqBlockProps {
  items: Array<{ question: string; answer: string }>;
}

export interface CustomHtmlBlockProps {
  html: string;
}

export interface SpacerBlockProps {
  height: number;
}

export type PageBlock =
  | { id: string; type: "hero"; props: HeroBlockProps }
  | { id: string; type: "text"; props: TextBlockProps }
  | { id: string; type: "image"; props: ImageBlockProps }
  | { id: string; type: "productGrid"; props: ProductGridBlockProps }
  | { id: string; type: "cta"; props: CtaBlockProps }
  | { id: string; type: "video"; props: VideoBlockProps }
  | { id: string; type: "testimonial"; props: TestimonialBlockProps }
  | { id: string; type: "faq"; props: FaqBlockProps }
  | { id: string; type: "custom"; props: CustomHtmlBlockProps }
  | { id: string; type: "spacer"; props: SpacerBlockProps };

export type BlockType = PageBlock["type"];

/** Human-readable labels and descriptions for block types */
export const BLOCK_TYPE_META: Record<
  BlockType,
  { label: string; description: string; icon: string }
> = {
  hero: {
    label: "Hero Banner",
    description: "Full-width hero section with image, text overlay, and CTA",
    icon: "Layout",
  },
  text: {
    label: "Rich Text",
    description: "Formatted text content with headings, lists, and links",
    icon: "Type",
  },
  image: {
    label: "Image",
    description: "Single image with optional caption and link",
    icon: "Image",
  },
  productGrid: {
    label: "Product Grid",
    description: "Display products from a category or hand-picked selection",
    icon: "Grid3X3",
  },
  cta: {
    label: "Call to Action",
    description: "Promotional section with heading, text, and button",
    icon: "MousePointerClick",
  },
  video: {
    label: "Video",
    description: "Embedded video from URL",
    icon: "Play",
  },
  testimonial: {
    label: "Testimonial",
    description: "Customer quote with author attribution",
    icon: "Quote",
  },
  faq: {
    label: "FAQ",
    description: "Expandable frequently asked questions",
    icon: "HelpCircle",
  },
  custom: {
    label: "Custom HTML",
    description: "Raw HTML/CSS for advanced layouts",
    icon: "Code",
  },
  spacer: {
    label: "Spacer",
    description: "Vertical whitespace between blocks",
    icon: "MoveVertical",
  },
};

/** Get default props for a new block of the given type */
export function getDefaultBlockProps(type: BlockType): PageBlock["props"] {
  switch (type) {
    case "hero":
      return { title: "Welcome", subtitle: "", imageUrl: "", ctaText: "Shop Now", ctaLink: "/shop", overlayOpacity: 40, textColor: "#FFFFFF", textAlign: "center" };
    case "text":
      return { content: "" };
    case "image":
      return { imageUrl: "", altText: "", caption: "", width: "contained" };
    case "productGrid":
      return { title: "Featured Products", columns: 4, limit: 8 };
    case "cta":
      return { title: "Ready to shop?", description: "", buttonText: "Browse Collection", buttonLink: "/shop", bgColor: "#DC2626", textColor: "#FFFFFF", alignment: "center" };
    case "video":
      return { url: "", caption: "" };
    case "testimonial":
      return { quote: "", author: "", role: "" };
    case "faq":
      return { items: [{ question: "", answer: "" }] };
    case "custom":
      return { html: "" };
    case "spacer":
      return { height: 48 };
  }
}
