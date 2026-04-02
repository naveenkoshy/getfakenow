/**
 * LivePreview — Real-time preview panel for the page builder.
 *
 * Renders a simplified preview of PageBlock content in a resizable panel.
 * Uses direct React rendering (no iframe) for instant updates on every
 * block change. Supports desktop/tablet/mobile viewport toggles.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import type { PageBlock } from "@shared/pageBlocks";

interface LivePreviewProps {
  blocks: PageBlock[];
}

const VIEWPORTS = {
  desktop: { width: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", label: "Tablet", icon: Tablet },
  mobile: { width: "375px", label: "Mobile", icon: Smartphone },
} as const;

type Viewport = keyof typeof VIEWPORTS;

export function LivePreview({ blocks }: LivePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
      {/* Viewport toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200">
        <span className="text-xs font-medium text-gray-500">Live Preview</span>
        <div className="flex items-center gap-1">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((vp) => {
            const { icon: Icon, label } = VIEWPORTS[vp];
            return (
              <Button
                key={vp}
                variant={viewport === vp ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport(vp)}
                className="h-7 w-7 p-0"
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto flex justify-center p-4">
        <div
          style={{ width: VIEWPORTS[viewport].width, maxWidth: "100%" }}
          className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300"
        >
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-300 text-sm">
              Add blocks to see a preview
            </div>
          ) : (
            blocks.map((block) => <BlockPreview key={block.id} block={block} />)
          )}
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <div
          className="relative min-h-[200px] flex items-center justify-center bg-gray-800 overflow-hidden"
          style={{
            backgroundImage: block.props.imageUrl ? `url(${block.props.imageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${(block.props.overlayOpacity ?? 40) / 100})` }}
          />
          <div className="relative z-10 p-6 text-center" style={{ color: block.props.textColor || "#FFFFFF", textAlign: (block.props.textAlign as any) || "center" }}>
            <h1 className="text-2xl font-bold">{block.props.title || "Hero Title"}</h1>
            {block.props.subtitle && <p className="mt-2 text-sm opacity-80">{block.props.subtitle}</p>}
            {block.props.ctaText && (
              <button className="mt-4 px-4 py-2 bg-white/20 backdrop-blur rounded text-sm font-medium hover:bg-white/30">
                {block.props.ctaText}
              </button>
            )}
          </div>
        </div>
      );

    case "text":
      return (
        <div className="px-6 py-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: block.props.content || "<p>Text content...</p>" }} />
      );

    case "image":
      return (
        <div className={`py-4 ${block.props.width === "full" ? "" : block.props.width === "small" ? "px-16" : "px-6"}`}>
          {block.props.imageUrl ? (
            <img src={block.props.imageUrl} alt={block.props.altText || ""} className="w-full rounded" />
          ) : (
            <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-sm">Image placeholder</div>
          )}
          {block.props.caption && <p className="text-xs text-gray-500 text-center mt-2">{block.props.caption}</p>}
        </div>
      );

    case "productGrid":
      return (
        <div className="px-6 py-4">
          {block.props.title && <h2 className="text-lg font-semibold mb-3">{block.props.title}</h2>}
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${block.props.columns || 4}, 1fr)` }}>
            {Array.from({ length: block.props.limit || 4 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-100" />
                <div className="p-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "cta":
      return (
        <div
          className="px-6 py-8 text-center"
          style={{ backgroundColor: block.props.bgColor || "#DC2626", color: block.props.textColor || "#FFFFFF" }}
        >
          <h2 className="text-xl font-bold">{block.props.title}</h2>
          {block.props.description && <p className="mt-2 text-sm opacity-90">{block.props.description}</p>}
          <button className="mt-4 px-5 py-2 bg-white/20 backdrop-blur rounded text-sm font-medium hover:bg-white/30">
            {block.props.buttonText}
          </button>
        </div>
      );

    case "video":
      return (
        <div className="px-6 py-4">
          <div className="aspect-video bg-gray-900 rounded flex items-center justify-center text-gray-400">
            {block.props.url ? `Video: ${block.props.url}` : "Video placeholder"}
          </div>
          {block.props.caption && <p className="text-xs text-gray-500 text-center mt-2">{block.props.caption}</p>}
        </div>
      );

    case "testimonial":
      return (
        <div className="px-6 py-6 bg-gray-50">
          <blockquote className="text-base italic text-gray-700 text-center">
            &ldquo;{block.props.quote || "Customer testimonial..."}&rdquo;
          </blockquote>
          <p className="text-sm font-medium text-gray-900 text-center mt-3">
            {block.props.author || "Author"}
          </p>
          {block.props.role && (
            <p className="text-xs text-gray-500 text-center">{block.props.role}</p>
          )}
        </div>
      );

    case "faq":
      return (
        <div className="px-6 py-4 space-y-2">
          {block.props.items.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-800">{item.question || `Question ${i + 1}`}</p>
              <p className="text-xs text-gray-500 mt-1">{item.answer || "Answer..."}</p>
            </div>
          ))}
        </div>
      );

    case "custom":
      return (
        <div className="px-6 py-4" dangerouslySetInnerHTML={{ __html: block.props.html || "<p>Custom HTML...</p>" }} />
      );

    case "spacer":
      return <div style={{ height: block.props.height }} className="bg-transparent" />;

    default:
      return null;
  }
}
