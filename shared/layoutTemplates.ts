/**
 * Layout Templates — Pre-built page templates for the visual page builder.
 *
 * Each template is a named array of PageBlock objects that gets injected
 * into blocksJson when a user picks a template for a new page.
 */
import type { PageBlock } from "./pageBlocks";

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  /** Simple ASCII-art representation for the template card */
  preview: string;
  blocks: PageBlock[];
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "blank",
    name: "Blank Page",
    description: "Start from scratch with an empty page.",
    preview: "[ empty ]",
    blocks: [],
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Hero banner, text section, and call-to-action.",
    preview: "Hero → Text → CTA",
    blocks: [
      {
        id: "t-hero-1",
        type: "hero",
        props: {
          title: "Welcome to Our Store",
          subtitle: "Discover the latest collection",
          imageUrl: "",
          ctaText: "Shop Now",
          ctaLink: "/shop",
          overlayOpacity: 40,
          textColor: "#FFFFFF",
          textAlign: "center",
        },
      },
      {
        id: "t-text-1",
        type: "text",
        props: {
          content: "<h2>About Our Collection</h2><p>Write about what makes your products special. This section is great for storytelling and building trust with your customers.</p>",
        },
      },
      {
        id: "t-cta-1",
        type: "cta",
        props: {
          title: "Ready to shop?",
          description: "Browse our full collection and find something you love.",
          buttonText: "Browse Collection",
          buttonLink: "/shop",
          bgColor: "#DC2626",
          textColor: "#FFFFFF",
          alignment: "center",
        },
      },
    ],
  },
  {
    id: "about",
    name: "About Us",
    description: "Hero, story text, and customer testimonial.",
    preview: "Hero → Text → Testimonial",
    blocks: [
      {
        id: "t-hero-2",
        type: "hero",
        props: {
          title: "Our Story",
          subtitle: "Learn about who we are and what drives us",
          imageUrl: "",
          overlayOpacity: 50,
          textColor: "#FFFFFF",
          textAlign: "center",
        },
      },
      {
        id: "t-text-2",
        type: "text",
        props: {
          content: "<h2>Who We Are</h2><p>Share your brand story here. Talk about your mission, values, and what inspired you to create this brand. Customers connect with authentic stories.</p><h3>Our Mission</h3><p>Describe your purpose and what you aim to achieve for your customers.</p>",
        },
      },
      {
        id: "t-testimonial-1",
        type: "testimonial",
        props: {
          quote: "This brand truly cares about quality and their customers. I have been a loyal customer since day one.",
          author: "Happy Customer",
          role: "Verified Buyer",
        },
      },
    ],
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    description: "Hero, product grid, and call-to-action.",
    preview: "Hero → Products → CTA",
    blocks: [
      {
        id: "t-hero-3",
        type: "hero",
        props: {
          title: "New Arrivals",
          subtitle: "Check out our latest products",
          imageUrl: "",
          ctaText: "View All",
          ctaLink: "/shop",
          overlayOpacity: 40,
          textColor: "#FFFFFF",
          textAlign: "center",
        },
      },
      {
        id: "t-grid-1",
        type: "productGrid",
        props: {
          title: "Featured Products",
          columns: 4,
          limit: 8,
        },
      },
      {
        id: "t-cta-2",
        type: "cta",
        props: {
          title: "See the full collection",
          description: "We have something for everyone.",
          buttonText: "Shop All Products",
          buttonLink: "/shop",
          bgColor: "#000000",
          textColor: "#FFFFFF",
          alignment: "center",
        },
      },
    ],
  },
  {
    id: "faq-page",
    name: "FAQ Page",
    description: "Introduction text and FAQ accordion.",
    preview: "Text → FAQ → CTA",
    blocks: [
      {
        id: "t-text-3",
        type: "text",
        props: {
          content: "<h1>Frequently Asked Questions</h1><p>Find answers to the most common questions about our products, shipping, and returns.</p>",
        },
      },
      {
        id: "t-faq-1",
        type: "faq",
        props: {
          items: [
            { question: "What is your return policy?", answer: "We offer a 30-day return policy on all items. Items must be unworn and in original packaging." },
            { question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days. Express shipping is available at checkout." },
            { question: "Do you ship internationally?", answer: "Currently we ship within Malaysia. International shipping coming soon." },
            { question: "How can I track my order?", answer: "Once your order ships, you will receive a tracking number via email." },
          ],
        },
      },
      {
        id: "t-cta-3",
        type: "cta",
        props: {
          title: "Still have questions?",
          description: "Our support team is here to help.",
          buttonText: "Contact Us",
          buttonLink: "/contact",
          bgColor: "#374151",
          textColor: "#FFFFFF",
          alignment: "center",
        },
      },
    ],
  },
  {
    id: "contact",
    name: "Contact Page",
    description: "Introduction text and contact CTA.",
    preview: "Text → CTA",
    blocks: [
      {
        id: "t-text-4",
        type: "text",
        props: {
          content: "<h1>Get in Touch</h1><p>We would love to hear from you. Whether you have a question about our products, need help with an order, or want to share feedback, do not hesitate to reach out.</p><h3>Business Hours</h3><p>Monday - Friday: 9AM - 6PM (MYT)<br/>Saturday: 10AM - 4PM<br/>Sunday: Closed</p>",
        },
      },
      {
        id: "t-cta-4",
        type: "cta",
        props: {
          title: "Email Us",
          description: "Send us a message and we will get back to you within 24 hours.",
          buttonText: "hello@getfakenow.com",
          buttonLink: "mailto:hello@getfakenow.com",
          bgColor: "#DC2626",
          textColor: "#FFFFFF",
          alignment: "center",
        },
      },
    ],
  },
];
