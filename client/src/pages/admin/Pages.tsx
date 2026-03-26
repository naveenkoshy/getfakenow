import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, FileText, Blocks } from "lucide-react";

export default function AdminPages() {
  const { data: pages, isLoading: pagesLoading, refetch: refetchPages } = trpc.admin.pages.list.useQuery();
  const { data: blocks, isLoading: blocksLoading, refetch: refetchBlocks } = trpc.admin.contentBlocks.list.useQuery();
  const [tab, setTab] = useState("pages");

  // Pages state
  const [pageDialog, setPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageForm, setPageForm] = useState({ key: "", title: "", body: "", metaTitle: "", metaDescription: "", published: true });

  const createPage = trpc.admin.pages.create.useMutation({ onSuccess: () => { toast.success("Page created"); refetchPages(); setPageDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const updatePage = trpc.admin.pages.update.useMutation({ onSuccess: () => { toast.success("Page updated"); refetchPages(); setPageDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const deletePage = trpc.admin.pages.delete.useMutation({ onSuccess: () => { toast.success("Page deleted"); refetchPages(); }, onError: (e: any) => toast.error(e.message) });

  // Content blocks state
  const [blockDialog, setBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [blockForm, setBlockForm] = useState({ pageKey: "home", blockType: "text", title: "", content: "", sortOrder: 0 });

  const createBlock = trpc.admin.contentBlocks.create.useMutation({ onSuccess: () => { toast.success("Block created"); refetchBlocks(); setBlockDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const updateBlock = trpc.admin.contentBlocks.update.useMutation({ onSuccess: () => { toast.success("Block updated"); refetchBlocks(); setBlockDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const deleteBlock = trpc.admin.contentBlocks.delete.useMutation({ onSuccess: () => { toast.success("Block deleted"); refetchBlocks(); }, onError: (e: any) => toast.error(e.message) });

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages & Content</h1>
          <p className="text-sm text-gray-500 mt-1">Manage static pages and content blocks</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pages">Static Pages</TabsTrigger>
            <TabsTrigger value="blocks">Content Blocks</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingPage(null); setPageForm({ key: "", title: "", body: "", metaTitle: "", metaDescription: "", published: true }); setPageDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Page
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {pagesLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !pages?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No pages yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {pages.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{p.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {p.published ? "Published" : "Draft"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono">/{p.key}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingPage(p); setPageForm({ key: p.key, title: p.title, body: p.body, metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "", published: p.published }); setPageDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deletePage.mutate({ id: p.id }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocks" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingBlock(null); setBlockForm({ pageKey: "home", blockType: "text", title: "", content: "", sortOrder: 0 }); setBlockDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Block
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {blocksLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !blocks?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <Blocks className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No content blocks yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {blocks.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.title || b.blockType}</p>
                          <p className="text-xs text-gray-500">Page: {b.pageKey} &middot; Type: {b.blockType} &middot; Order: {b.sortOrder}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingBlock(b); setBlockForm({ pageKey: b.pageKey, blockType: b.blockType, title: b.title || "", content: b.content, sortOrder: b.sortOrder }); setBlockDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteBlock.mutate({ id: b.id }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Page Dialog */}
      <Dialog open={pageDialog} onOpenChange={(o) => !o && setPageDialog(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPage ? "Edit Page" : "New Page"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Title</label><Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value, key: editingPage ? pageForm.key : autoSlug(e.target.value) })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">URL Key</label><Input value={pageForm.key} onChange={(e) => setPageForm({ ...pageForm, key: e.target.value })} className="mt-1 font-mono" disabled={!!editingPage} /></div>
            </div>
            <div><label className="text-sm font-medium">Body (HTML)</label><Textarea value={pageForm.body} onChange={(e) => setPageForm({ ...pageForm, body: e.target.value })} rows={10} className="mt-1 font-mono text-xs" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Meta Title</label><Input value={pageForm.metaTitle} onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Meta Description</label><Input value={pageForm.metaDescription} onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={pageForm.published} onCheckedChange={(v) => setPageForm({ ...pageForm, published: v })} />
              <label className="text-sm font-medium">Published</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPageDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!pageForm.key || !pageForm.title || !pageForm.body) return toast.error("Fill required fields");
              if (editingPage) { updatePage.mutate({ id: editingPage.id, ...pageForm }); } else { createPage.mutate(pageForm); }
            }} disabled={createPage.isPending || updatePage.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createPage.isPending || updatePage.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingPage ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialog} onOpenChange={(o) => !o && setBlockDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBlock ? "Edit Block" : "New Block"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Page Key</label><Input value={blockForm.pageKey} onChange={(e) => setBlockForm({ ...blockForm, pageKey: e.target.value })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Block Type</label><Input value={blockForm.blockType} onChange={(e) => setBlockForm({ ...blockForm, blockType: e.target.value })} placeholder="text, hero, cta, grid" className="mt-1" /></div>
            </div>
            <div><label className="text-sm font-medium">Title</label><Input value={blockForm.title} onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })} className="mt-1" /></div>
            <div><label className="text-sm font-medium">Content (JSON or HTML)</label><Textarea value={blockForm.content} onChange={(e) => setBlockForm({ ...blockForm, content: e.target.value })} rows={6} className="mt-1 font-mono text-xs" /></div>
            <div><label className="text-sm font-medium">Sort Order</label><Input type="number" value={blockForm.sortOrder} onChange={(e) => setBlockForm({ ...blockForm, sortOrder: Number(e.target.value) })} className="mt-1 w-24" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!blockForm.pageKey || !blockForm.blockType || !blockForm.content) return toast.error("Fill required fields");
              if (editingBlock) { updateBlock.mutate({ id: editingBlock.id, ...blockForm }); } else { createBlock.mutate(blockForm); }
            }} disabled={createBlock.isPending || updateBlock.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createBlock.isPending || updateBlock.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBlock ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
