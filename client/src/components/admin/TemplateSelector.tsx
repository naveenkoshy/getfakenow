/**
 * TemplateSelector — Grid of layout template cards shown when creating a new page.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout, FileText } from "lucide-react";
import { LAYOUT_TEMPLATES, type LayoutTemplate } from "@shared/layoutTemplates";
import type { PageBlock } from "@shared/pageBlocks";

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: LayoutTemplate) => void;
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" /> Choose a Page Template
          </DialogTitle>
          <DialogDescription>
            Pick a starting layout for your new page. You can customize everything after.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {LAYOUT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => { onSelect(template); onClose(); }}
              className="text-left group"
            >
              <Card className="border-gray-200 hover:border-red-400 hover:shadow-md transition-all h-full group-hover:ring-2 group-hover:ring-red-500/10">
                <CardContent className="p-4 flex flex-col h-full">
                  {/* Template visual preview */}
                  <div className="bg-gray-50 rounded-md border border-gray-100 p-3 mb-3 min-h-[80px] flex flex-col gap-1">
                    {template.blocks.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <FileText className="h-8 w-8" />
                      </div>
                    ) : (
                      template.blocks.map((block: PageBlock) => (
                        <div
                          key={block.id}
                          className={`rounded text-[9px] text-center py-0.5 px-1 font-medium ${
                            block.type === "hero" ? "bg-red-100 text-red-600" :
                            block.type === "text" ? "bg-blue-100 text-blue-600" :
                            block.type === "cta" ? "bg-green-100 text-green-600" :
                            block.type === "productGrid" ? "bg-purple-100 text-purple-600" :
                            block.type === "testimonial" ? "bg-amber-100 text-amber-600" :
                            block.type === "faq" ? "bg-cyan-100 text-cyan-600" :
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {block.type}
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{template.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex-1">{template.description}</p>
                  <Badge className="mt-2 text-[10px] bg-gray-100 text-gray-500 w-fit">
                    {template.blocks.length} block{template.blocks.length !== 1 ? "s" : ""}
                  </Badge>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
