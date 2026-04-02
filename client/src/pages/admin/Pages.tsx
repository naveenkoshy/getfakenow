import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { TemplateSelector } from "@/components/admin/TemplateSelector";
import { LivePreview } from "@/components/admin/LivePreview";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, FileText, Blocks, HelpCircle, Eye, Globe,
  EyeOff, Search, ExternalLink, Image, Copy, CheckCircle2, AlertTriangle,
  LayoutTemplate, PanelLeftClose, PanelLeftOpen, Code2, Wand2
} from "lucide-react";
import { PageHeader, HelpText } from "@/components/admin/CmsUI";
import type { PageBlock } from "@shared/pageBlocks";
import type { LayoutTemplate as LayoutTemplateType } from "@shared/layoutTemplates";

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <HelpText>{hint}</HelpText>}
    </div>
  );
}

const BLOCK_TYPES = [
  { value: "hero", label: "Hero Banner", desc: "Full-width hero section with image and CTA" },
  { value: "text", label: "Text Block", desc: "Rich text content section" },
  { value: "image", label: "Image Block", desc: "Single image or image gallery" },
  { value: "video", label: "Video Block", desc: "Embedded video content" },
  { value: "cta", label: "Call to Action", desc: "Promotional CTA section" },
  { value: "grid", label: "Grid Layout", desc: "Multi-column grid of items" },
  { value: "testimonial", label: "Testimonial", desc: "Customer testimonial or review" },
  { value: "faq", label: "FAQ", desc: "Frequently asked questions accordion" },
  { value: "custom", label: "Custom HTML", desc: "Raw HTML/CSS content" },
];

export default function AdminPages() {
  const { data: pages, isLoading: pagesLoading, refetch: refetchPages } = trpc.admin.pages.list.useQuery();
  const { data: blocks, isLoading: blocksLoading, refetch: refetchBlocks } = trpc.admin.contentBlocks.list.useQuery();
  const { data: mediaItems } = trpc.admin.media.list.useQuery();
  const [tab, setTab] = useState("pages");
  const [searchQuery, setSearchQuery] = useState("");

  // Pages state
  const [pageDialog, setPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageForm, setPageForm] = useState({ key: "", title: "", body: "", metaTitle: "", metaDescription: "", published: true, blocksJson: "", templateId: "" });
  const [pageErrors, setPageErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: "page" | "block"; item: any } | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"page" | "block">("page");

  // Visual page builder state
  const [editorMode, setEditorMode] = useState<"rich" | "blocks">("rich");
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [showPreviewPanel, setShowPreviewPanel] = useState(true);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  const handleBlocksChange = useCallback((blocks: PageBlock[]) => {
    setPageBlocks(blocks);
    setPageForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks) }));
  }, []);

  const handleTemplateSelect = useCallback((template: LayoutTemplateType) => {
    const blocks = template.blocks.map(b => ({ ...b, id: `${b.id}-${Date.now()}` }));
    setPageBlocks(blocks);
    setPageForm(prev => ({ ...prev, blocksJson: JSON.stringify(blocks), templateId: template.id }));
    setEditorMode("blocks");
    setTemplateSelectorOpen(false);
    setPageDialog(true);
  }, []);

  const createPage = trpc.admin.pages.create.useMutation({ onSuccess: () => { toast.success("Page created"); refetchPages(); setPageDialog(false); resetPageForm(); }, onError: (e: any) => toast.error(e.message) });
  const updatePage = trpc.admin.pages.update.useMutation({ onSuccess: () => { toast.success("Page updated"); refetchPages(); setPageDialog(false); resetPageForm(); }, onError: (e: any) => toast.error(e.message) });
  const deletePage = trpc.admin.pages.delete.useMutation({ onSuccess: () => { toast.success("Page deleted"); refetchPages(); setDeleteTarget(null); }, onError: (e: any) => toast.error(e.message) });

  // Content blocks state
  const [blockDialog, setBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [blockForm, setBlockForm] = useState({ pageKey: "home", blockType: "text", title: "", content: "", sortOrder: 0 });
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});

  const createBlock = trpc.admin.contentBlocks.create.useMutation({ onSuccess: () => { toast.success("Block created"); refetchBlocks(); setBlockDialog(false); resetBlockForm(); }, onError: (e: any) => toast.error(e.message) });
  const updateBlock = trpc.admin.contentBlocks.update.useMutation({ onSuccess: () => { toast.success("Block updated"); refetchBlocks(); setBlockDialog(false); resetBlockForm(); }, onError: (e: any) => toast.error(e.message) });
  const deleteBlock = trpc.admin.contentBlocks.delete.useMutation({ onSuccess: () => { toast.success("Block deleted"); refetchBlocks(); setDeleteTarget(null); }, onError: (e: any) => toast.error(e.message) });

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const resetPageForm = () => { setPageForm({ key: "", title: "", body: "", metaTitle: "", metaDescription: "", published: true, blocksJson: "", templateId: "" }); setPageErrors({}); setEditingPage(null); setPageBlocks([]); setEditorMode("rich"); };
  const resetBlockForm = () => { setBlockForm({ pageKey: "home", blockType: "text", title: "", content: "", sortOrder: 0 }); setBlockErrors({}); setEditingBlock(null); };

  const validatePageForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!pageForm.title.trim()) errors.title = "Title is required";
    if (!pageForm.key.trim()) errors.key = "URL key is required";
    else if (!/^[a-z0-9-]+$/.test(pageForm.key)) errors.key = "URL key must be lowercase letters, numbers, and hyphens only";
    if (editorMode === "rich" && !pageForm.body.trim()) errors.body = "Body content is required";
    if (editorMode === "blocks" && pageBlocks.length === 0) errors.body = "Add at least one block";
    if (pageForm.metaTitle && pageForm.metaTitle.length > 70) errors.metaTitle = "Meta title should be under 70 characters for SEO";
    if (pageForm.metaDescription && pageForm.metaDescription.length > 160) errors.metaDescription = "Meta description should be under 160 characters for SEO";
    setPageErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBlockForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!blockForm.pageKey.trim()) errors.pageKey = "Page key is required";
    if (!blockForm.blockType) errors.blockType = "Block type is required";
    if (!blockForm.content.trim()) errors.content = "Content is required";
    setBlockErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const insertMediaUrl = (url: string) => {
    if (mediaPickerTarget === "page") {
      const imgTag = `<img src="${url}" alt="" class="w-full rounded-lg" />`;
      setPageForm(prev => ({ ...prev, body: prev.body + "\n" + imgTag }));
    } else {
      setBlockForm(prev => ({ ...prev, content: prev.content + "\n" + url }));
    }
    setMediaPickerOpen(false);
    toast.success("Media URL inserted");
  };

  const filteredPages = (pages || []).filter((p: any) =>
    !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBlocks = (blocks || []).filter((b: any) =>
    !searchQuery || (b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || b.pageKey.toLowerCase().includes(searchQuery.toLowerCase()) || b.blockType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mediaList = (mediaItems as any)?.media || mediaItems || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Pages & Content"
          description="Create and manage static pages and reusable content blocks for your storefront."
        />

        {/* Help banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> How Pages & Content Blocks Work</p>
            <p className="mt-1 text-blue-700">
              <strong>Static Pages</strong> are standalone pages (e.g., About Us, Terms, Contact) accessible via their URL key.
              Use the <strong>Block Editor</strong> to visually build pages with drag-and-drop blocks, or the <strong>Rich Text</strong> editor for simple HTML content.
              Click <strong>"New from Template"</strong> to start with a pre-built layout.
              <strong> Content Blocks</strong> are reusable sections you can place on any page.
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search pages and blocks..." className="pl-10" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pages" className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Static Pages ({filteredPages.length})</TabsTrigger>
            <TabsTrigger value="blocks" className="flex items-center gap-1.5"><Blocks className="h-3.5 w-3.5" /> Content Blocks ({filteredBlocks.length})</TabsTrigger>
          </TabsList>

          {/* ===== Static Pages Tab ===== */}
          <TabsContent value="pages" className="space-y-4 mt-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetPageForm(); setPageDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Blank Page
              </Button>
              <Button onClick={() => { resetPageForm(); setTemplateSelectorOpen(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <LayoutTemplate className="h-4 w-4 mr-2" /> New from Template
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {pagesLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !filteredPages.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">{searchQuery ? "No pages match your search" : "No pages yet"}</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first page to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredPages.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{p.title}</p>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${p.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {p.published ? <><Globe className="h-3 w-3" /> Published</> : <><EyeOff className="h-3 w-3" /> Draft</>}
                            </span>
                            {p.blocksJson && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                <Wand2 className="h-3 w-3" /> Block Editor
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">/{p.key}</p>
                          {p.metaTitle && <p className="text-xs text-gray-400 mt-0.5 truncate">SEO: {p.metaTitle}</p>}
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button variant="ghost" size="sm" title="Preview" onClick={() => setPreviewHtml(p.body)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit" onClick={() => {
                            setEditingPage(p);
                            const blocks = p.blocksJson ? (() => { try { return JSON.parse(p.blocksJson); } catch { return []; } })() : [];
                            setPageBlocks(blocks);
                            setEditorMode(blocks.length > 0 ? "blocks" : "rich");
                            setPageForm({ key: p.key, title: p.title, body: p.body || "", metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "", published: p.published, blocksJson: p.blocksJson || "", templateId: p.templateId || "" });
                            setPageErrors({});
                            setPageDialog(true);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" title="Delete" onClick={() => setDeleteTarget({ type: "page", item: p })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Content Blocks Tab ===== */}
          <TabsContent value="blocks" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => { resetBlockForm(); setBlockDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Block
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {blocksLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !filteredBlocks.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <Blocks className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">{searchQuery ? "No blocks match your search" : "No content blocks yet"}</p>
                    <p className="text-sm text-gray-400 mt-1">Content blocks are reusable sections you can place on any page.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredBlocks.map((b: any) => {
                      const bt = BLOCK_TYPES.find(t => t.value === b.blockType);
                      return (
                        <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{b.title || bt?.label || b.blockType}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">{bt?.label || b.blockType}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Page: <span className="font-mono">{b.pageKey}</span> — Sort: {b.sortOrder}</p>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Button variant="ghost" size="sm" title="Preview" onClick={() => setPreviewHtml(b.content)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Edit" onClick={() => {
                              setEditingBlock(b);
                              setBlockForm({ pageKey: b.pageKey, blockType: b.blockType, title: b.title || "", content: b.content, sortOrder: b.sortOrder });
                              setBlockErrors({});
                              setBlockDialog(true);
                            }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" title="Delete" onClick={() => setDeleteTarget({ type: "block", item: b })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== Template Selector ===== */}
      <TemplateSelector
        open={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelect={handleTemplateSelect}
      />

      {/* ===== Page Dialog ===== */}
      <Dialog open={pageDialog} onOpenChange={(o) => { if (!o) { setPageDialog(false); resetPageForm(); } }}>
        <DialogContent className={editorMode === "blocks" ? "max-w-[95vw] w-full max-h-[95vh] h-[95vh] flex flex-col" : "max-w-3xl max-h-[90vh] overflow-y-auto"}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{editingPage ? "Edit Page" : "Create New Page"}</DialogTitle>
                <DialogDescription>
                  {editorMode === "blocks"
                    ? "Drag and drop blocks to build your page layout. Toggle the preview panel to see changes in real time."
                    : editingPage ? "Update the page content, SEO metadata, and publishing status." : "Create a new static page for your storefront."}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={editorMode === "rich" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditorMode("rich")}
                  title="Rich text editor"
                >
                  <Code2 className="h-3.5 w-3.5 mr-1.5" /> Rich Text
                </Button>
                <Button
                  variant={editorMode === "blocks" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditorMode("blocks")}
                  title="Visual block editor"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Block Editor
                </Button>
                {editorMode === "blocks" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                    title={showPreviewPanel ? "Hide preview" : "Show preview"}
                  >
                    {showPreviewPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {editorMode === "blocks" ? (
            /* ===== Block Editor Mode ===== */
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* Title & Key row */}
              <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                <div>
                  <FieldLabel label="Page Title" required />
                  <Input
                    value={pageForm.title}
                    onChange={(e) => { setPageForm({ ...pageForm, title: e.target.value, key: editingPage ? pageForm.key : autoSlug(e.target.value) }); setPageErrors(prev => ({ ...prev, title: "" })); }}
                    className={`mt-1 ${pageErrors.title ? "border-red-500" : ""}`}
                    placeholder="e.g., About Us"
                  />
                  {pageErrors.title && <p className="text-xs text-red-500 mt-1">{pageErrors.title}</p>}
                </div>
                <div>
                  <FieldLabel label="URL Key" required />
                  <Input
                    value={pageForm.key}
                    onChange={(e) => { setPageForm({ ...pageForm, key: e.target.value }); setPageErrors(prev => ({ ...prev, key: "" })); }}
                    className={`mt-1 font-mono ${pageErrors.key ? "border-red-500" : ""}`}
                    disabled={!!editingPage}
                    placeholder="about-us"
                  />
                  {pageErrors.key && <p className="text-xs text-red-500 mt-1">{pageErrors.key}</p>}
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${pageForm.published ? "text-green-600" : "text-gray-500"}`}>
                      {pageForm.published ? "Published" : "Draft"}
                    </span>
                    <Switch checked={pageForm.published} onCheckedChange={(v) => setPageForm({ ...pageForm, published: v })} />
                  </div>
                </div>
              </div>

              {/* Builder + Preview split */}
              <div className="flex-1 flex gap-4 overflow-hidden">
                <div className={`${showPreviewPanel ? "w-1/2" : "w-full"} overflow-y-auto`}>
                  <PageBuilder blocks={pageBlocks} onChange={handleBlocksChange} />
                </div>
                {showPreviewPanel && (
                  <div className="w-1/2 overflow-hidden">
                    <LivePreview blocks={pageBlocks} />
                  </div>
                )}
              </div>

              {/* SEO collapsible */}
              <details className="flex-shrink-0 bg-gray-50 rounded-lg p-4">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">SEO Settings</summary>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <FieldLabel label="Meta Title" hint={`${pageForm.metaTitle.length}/70`} />
                    <Input value={pageForm.metaTitle} onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })} className="mt-1" placeholder="Page title for search engines" />
                  </div>
                  <div>
                    <FieldLabel label="Meta Description" hint={`${pageForm.metaDescription.length}/160`} />
                    <Input value={pageForm.metaDescription} onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })} className="mt-1" placeholder="Brief description for search engines" />
                  </div>
                </div>
              </details>
            </div>
          ) : (
            /* ===== Rich Text Editor Mode ===== */
            <div className="space-y-5">
              {/* Title & Key */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Page Title" required hint="The main heading displayed on the page." />
                  <Input
                    value={pageForm.title}
                    onChange={(e) => { setPageForm({ ...pageForm, title: e.target.value, key: editingPage ? pageForm.key : autoSlug(e.target.value) }); setPageErrors(prev => ({ ...prev, title: "" })); }}
                    className={`mt-1 ${pageErrors.title ? "border-red-500" : ""}`}
                    placeholder="e.g., About Us"
                  />
                  {pageErrors.title && <p className="text-xs text-red-500 mt-1">{pageErrors.title}</p>}
                </div>
                <div>
                  <FieldLabel label="URL Key" required hint="The URL path for this page (e.g., /about-us). Auto-generated from title." />
                  <Input
                    value={pageForm.key}
                    onChange={(e) => { setPageForm({ ...pageForm, key: e.target.value }); setPageErrors(prev => ({ ...prev, key: "" })); }}
                    className={`mt-1 font-mono ${pageErrors.key ? "border-red-500" : ""}`}
                    disabled={!!editingPage}
                    placeholder="about-us"
                  />
                  {pageErrors.key && <p className="text-xs text-red-500 mt-1">{pageErrors.key}</p>}
                </div>
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between">
                  <FieldLabel label="Body Content" required hint="Write HTML content. Use the media picker to insert images and videos from your library." />
                  <Button variant="outline" size="sm" onClick={() => { setMediaPickerTarget("page"); setMediaPickerOpen(true); }}>
                    <Image className="h-3.5 w-3.5 mr-1.5" /> Insert Media
                  </Button>
                </div>
                <RichTextEditor
                  content={pageForm.body}
                  onChange={(html) => { setPageForm({ ...pageForm, body: html }); setPageErrors(prev => ({ ...prev, body: "" })); }}
                  placeholder="Start writing your page content…"
                  minHeight={250}
                  error={!!pageErrors.body}
                />
                {pageErrors.body && <p className="text-xs text-red-500 mt-1">{pageErrors.body}</p>}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{pageForm.body.length} characters</p>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(pageForm.body)} className="text-xs">
                    <Eye className="h-3 w-3 mr-1" /> Preview
                  </Button>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">SEO Settings</h3>
                <div>
                  <FieldLabel label="Meta Title" hint={`${pageForm.metaTitle.length}/70 characters. Appears in search engine results.`} />
                  <Input
                    value={pageForm.metaTitle}
                    onChange={(e) => { setPageForm({ ...pageForm, metaTitle: e.target.value }); setPageErrors(prev => ({ ...prev, metaTitle: "" })); }}
                    className={`mt-1 ${pageErrors.metaTitle ? "border-amber-500" : ""}`}
                    placeholder="Page title for search engines"
                  />
                  {pageErrors.metaTitle && <p className="text-xs text-amber-600 mt-1">{pageErrors.metaTitle}</p>}
                </div>
                <div>
                  <FieldLabel label="Meta Description" hint={`${pageForm.metaDescription.length}/160 characters. Shown below the title in search results.`} />
                  <Textarea
                    value={pageForm.metaDescription}
                    onChange={(e) => { setPageForm({ ...pageForm, metaDescription: e.target.value }); setPageErrors(prev => ({ ...prev, metaDescription: "" })); }}
                    className={`mt-1 ${pageErrors.metaDescription ? "border-amber-500" : ""}`}
                    rows={2}
                    placeholder="Brief description for search engines"
                  />
                  {pageErrors.metaDescription && <p className="text-xs text-amber-600 mt-1">{pageErrors.metaDescription}</p>}
                </div>
              </div>

              {/* Publishing */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Publishing Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pageForm.published ? "This page is live and visible to visitors." : "This page is saved as a draft and not visible to visitors."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${pageForm.published ? "text-green-600" : "text-gray-500"}`}>
                    {pageForm.published ? "Published" : "Draft"}
                  </span>
                  <Switch checked={pageForm.published} onCheckedChange={(v) => setPageForm({ ...pageForm, published: v })} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => { setPageDialog(false); resetPageForm(); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (!validatePageForm()) return;
                const payload = { ...pageForm };
                if (editorMode === "blocks") {
                  payload.blocksJson = JSON.stringify(pageBlocks);
                }
                if (editingPage) { updatePage.mutate({ id: editingPage.id, ...payload }); } else { createPage.mutate(payload); }
              }}
              disabled={createPage.isPending || updatePage.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {(createPage.isPending || updatePage.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingPage ? "Update Page" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Block Dialog ===== */}
      <Dialog open={blockDialog} onOpenChange={(o) => { if (!o) { setBlockDialog(false); resetBlockForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit Content Block" : "Create Content Block"}</DialogTitle>
            <DialogDescription>
              Content blocks are reusable sections that can be placed on any page. Choose a block type and add your content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Page Key" required hint="Which page this block belongs to (e.g., home, about-us)." />
                <Input
                  value={blockForm.pageKey}
                  onChange={(e) => { setBlockForm({ ...blockForm, pageKey: e.target.value }); setBlockErrors(prev => ({ ...prev, pageKey: "" })); }}
                  className={`mt-1 font-mono ${blockErrors.pageKey ? "border-red-500" : ""}`}
                  placeholder="home"
                />
                {blockErrors.pageKey && <p className="text-xs text-red-500 mt-1">{blockErrors.pageKey}</p>}
              </div>
              <div>
                <FieldLabel label="Block Type" required hint="The visual layout type for this content section." />
                <Select value={blockForm.blockType} onValueChange={(v) => { setBlockForm({ ...blockForm, blockType: v }); setBlockErrors(prev => ({ ...prev, blockType: "" })); }}>
                  <SelectTrigger className={`mt-1 ${blockErrors.blockType ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_TYPES.map(bt => (
                      <SelectItem key={bt.value} value={bt.value}>
                        <div>
                          <span className="font-medium">{bt.label}</span>
                          <span className="text-xs text-gray-400 ml-2">{bt.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {blockErrors.blockType && <p className="text-xs text-red-500 mt-1">{blockErrors.blockType}</p>}
              </div>
            </div>

            <div>
              <FieldLabel label="Block Title" hint="Optional display title for this section." />
              <Input value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} className="mt-1" placeholder="Section heading" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <FieldLabel label="Content" required hint="HTML content or JSON configuration depending on block type." />
                <Button variant="outline" size="sm" onClick={() => { setMediaPickerTarget("block"); setMediaPickerOpen(true); }}>
                  <Image className="h-3.5 w-3.5 mr-1.5" /> Insert Media
                </Button>
              </div>
              {blockForm.blockType === "custom" ? (
                <Textarea
                  value={blockForm.content}
                  onChange={(e) => { setBlockForm({ ...blockForm, content: e.target.value }); setBlockErrors(prev => ({ ...prev, content: "" })); }}
                  rows={8}
                  className={`mt-1 font-mono text-xs ${blockErrors.content ? "border-red-500" : ""}`}
                  placeholder="<div>Your HTML here</div>"
                />
              ) : (
                <RichTextEditor
                  content={blockForm.content}
                  onChange={(html) => { setBlockForm({ ...blockForm, content: html }); setBlockErrors(prev => ({ ...prev, content: "" })); }}
                  placeholder="Write your block content…"
                  minHeight={180}
                  compact
                  error={!!blockErrors.content}
                />
              )}
              {blockErrors.content && <p className="text-xs text-red-500 mt-1">{blockErrors.content}</p>}
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">{blockForm.content.length} characters</p>
                <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(blockForm.content)} className="text-xs">
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              </div>
            </div>

            <div>
              <FieldLabel label="Sort Order" hint="Lower numbers appear first on the page. Use increments of 10 for easy reordering." />
              <Input type="number" value={blockForm.sortOrder} onChange={(e) => setBlockForm({ ...blockForm, sortOrder: Number(e.target.value) })} className="mt-1 w-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlockDialog(false); resetBlockForm(); }}>Cancel</Button>
            <Button
              onClick={() => {
                if (!validateBlockForm()) return;
                if (editingBlock) { updateBlock.mutate({ id: editingBlock.id, ...blockForm }); } else { createBlock.mutate(blockForm); }
              }}
              disabled={createBlock.isPending || updateBlock.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {(createBlock.isPending || updateBlock.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBlock ? "Update Block" : "Create Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== HTML Preview Dialog ===== */}
      <Dialog open={!!previewHtml} onOpenChange={(o) => { if (!o) setPreviewHtml(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Content Preview</DialogTitle>
            <DialogDescription>This is a preview of how the HTML content will render.</DialogDescription>
          </DialogHeader>
          <div className="bg-white border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: previewHtml || "" }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewHtml(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Media Picker Dialog ===== */}
      <Dialog open={mediaPickerOpen} onOpenChange={(o) => { if (!o) setMediaPickerOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> Select Media</DialogTitle>
            <DialogDescription>Click on a file to insert its URL into the content editor.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto">
            {mediaList.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-gray-500">
                <Image className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No media files. Upload files in the Media Library first.</p>
              </div>
            ) : (
              mediaList.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => insertMediaUrl(m.url)}
                  className="bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-400 transition-all text-left"
                >
                  <div className="aspect-square">
                    {m.mimeType?.startsWith("image/") ? (
                      <img src={m.url} alt={m.altText || ""} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 px-2 py-1 truncate">{m.fileName || m.filename}</p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete {deleteTarget?.type === "page" ? "Page" : "Content Block"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.item?.title || deleteTarget?.item?.key || "this item"}</strong>?
              This action cannot be undone.
              {deleteTarget?.type === "page" && " Any links pointing to this page will result in a 404 error."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePage.isPending || deleteBlock.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePage.isPending || deleteBlock.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget?.type === "page") deletePage.mutate({ id: deleteTarget.item.id });
                else if (deleteTarget?.type === "block") deleteBlock.mutate({ id: deleteTarget.item.id });
              }}
            >
              {(deletePage.isPending || deleteBlock.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
