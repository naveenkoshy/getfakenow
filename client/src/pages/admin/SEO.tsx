import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search, ArrowRightLeft, Globe, Settings } from "lucide-react";

export default function AdminSEO() {
  const { data: seoMetas, isLoading: metaLoading, refetch: refetchMeta } = trpc.admin.seo.list.useQuery();
  const { data: redirects, isLoading: redirLoading, refetch: refetchRedirects } = trpc.admin.seo.redirects.list.useQuery();
  const { data: allSettings, refetch: refetchSettings } = trpc.admin.settings.list.useQuery();
  const [tab, setTab] = useState("meta");

  // Meta state
  const [metaDialog, setMetaDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [metaForm, setMetaForm] = useState({ pagePath: "", metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "", noIndex: false, structuredData: "" });

  const createMeta = trpc.admin.seo.upsert.useMutation({ onSuccess: () => { toast.success("SEO meta saved"); refetchMeta(); setMetaDialog(false); }, onError: (e: any) => toast.error(e.message) });

  // Redirect state
  const [redirDialog, setRedirDialog] = useState(false);
  const [editingRedir, setEditingRedir] = useState<any>(null);
  const [redirForm, setRedirForm] = useState({ fromPath: "", toPath: "", type: "301" as "301" | "302" });

  const createRedir = trpc.admin.seo.redirects.create.useMutation({ onSuccess: () => { toast.success("Redirect created"); refetchRedirects(); setRedirDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const updateRedir = trpc.admin.seo.redirects.update.useMutation({ onSuccess: () => { toast.success("Redirect updated"); refetchRedirects(); setRedirDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const deleteRedir = trpc.admin.seo.redirects.delete.useMutation({ onSuccess: () => { toast.success("Redirect deleted"); refetchRedirects(); }, onError: (e: any) => toast.error(e.message) });

  // Settings
  const updateSettings = trpc.admin.settings.set.useMutation({ onSuccess: () => { toast.success("SEO settings saved"); refetchSettings(); }, onError: (e: any) => toast.error(e.message) });
  const [settingsForm, setSettingsForm] = useState<any>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-sm text-gray-500 mt-1">Optimize search engine visibility, manage redirects, and configure global SEO settings</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="meta"><Globe className="h-4 w-4 mr-1" /> Page Meta</TabsTrigger>
            <TabsTrigger value="redirects"><ArrowRightLeft className="h-4 w-4 mr-1" /> Redirects</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Global Settings</TabsTrigger>
          </TabsList>

          {/* Meta Tags Tab */}
          <TabsContent value="meta" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingMeta(null); setMetaForm({ pagePath: "", metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "", noIndex: false, structuredData: "" }); setMetaDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Page Meta
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {metaLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !seoMetas?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No custom SEO meta configured</p>
                    <p className="text-sm mt-1">Add page-specific meta tags for better search rankings</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {seoMetas.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-mono">{m.pagePath}</p>
                          <p className="text-xs text-gray-500 mt-1">{m.metaTitle || "No title"} &middot; {m.noIndex ? "noindex" : "indexed"}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingMeta(m);
                          setMetaForm({ pagePath: m.pagePath, metaTitle: m.metaTitle || "", metaDescription: m.metaDescription || "", ogTitle: m.ogTitle || "", ogDescription: m.ogDescription || "", ogImage: m.ogImage || "", canonicalUrl: m.canonicalUrl || "", noIndex: m.noIndex || false, structuredData: m.structuredData || "" });
                          setMetaDialog(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redirects Tab */}
          <TabsContent value="redirects" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingRedir(null); setRedirForm({ fromPath: "", toPath: "", type: "301" }); setRedirDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Redirect
              </Button>
            </div>
            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {redirLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : !redirects?.length ? (
                  <div className="text-center py-12 text-gray-500">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No redirects configured</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {redirects.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{r.fromPath}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">{r.toPath}</td>
                          <td className="px-6 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === "301" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{r.type}</span></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingRedir(r); setRedirForm({ fromPath: r.fromPath, toPath: r.toPath, type: r.type }); setRedirDialog(true); }}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { if (confirm("Delete?")) deleteRedir.mutate({ id: r.id }); }}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Global Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="bg-white border-gray-200">
              <CardHeader><CardTitle className="text-lg">Global SEO Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!allSettings?.length ? (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No global SEO settings configured yet.</p>
                    <Button onClick={() => setSettingsForm({ defaultTitleSuffix: " | Fake by Freetown", robotsTxt: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml", sitemapEnabled: true, googleAnalyticsId: "", googleSearchConsoleId: "", facebookPixelId: "" })} variant="outline" className="mt-3">Configure Now</Button>
                  </div>
                ) : !settingsForm ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {allSettings?.map((s: any) => (
                        <div key={s.key}><span className="text-gray-500">{s.key}:</span> <span className="font-medium">{s.value || "Not set"}</span></div>
                      ))}
                    </div>
                    <Button onClick={() => setSettingsForm({ defaultTitleSuffix: allSettings?.find((s: any) => s.key === 'seo_title_suffix')?.value || ' | Fake by Freetown', robotsTxt: allSettings?.find((s: any) => s.key === 'robots_txt')?.value || '', sitemapEnabled: true, googleAnalyticsId: allSettings?.find((s: any) => s.key === 'ga_id')?.value || '', googleSearchConsoleId: allSettings?.find((s: any) => s.key === 'gsc_id')?.value || '', facebookPixelId: allSettings?.find((s: any) => s.key === 'fb_pixel')?.value || '' })} variant="outline">Edit Settings</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div><label className="text-sm font-medium">Default Title Suffix</label><Input value={settingsForm.defaultTitleSuffix || ""} onChange={(e) => setSettingsForm({ ...settingsForm, defaultTitleSuffix: e.target.value })} placeholder=" | Fake by Freetown" className="mt-1" /></div>
                    <div><label className="text-sm font-medium">robots.txt</label><Textarea value={settingsForm.robotsTxt || ""} onChange={(e) => setSettingsForm({ ...settingsForm, robotsTxt: e.target.value })} rows={5} className="mt-1 font-mono text-xs" /></div>
                    <div className="flex items-center gap-3"><Switch checked={settingsForm.sitemapEnabled} onCheckedChange={(v) => setSettingsForm({ ...settingsForm, sitemapEnabled: v })} /><label className="text-sm font-medium">Enable Sitemap</label></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-medium">Google Analytics ID</label><Input value={settingsForm.googleAnalyticsId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" className="mt-1 font-mono" /></div>
                      <div><label className="text-sm font-medium">Search Console ID</label><Input value={settingsForm.googleSearchConsoleId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, googleSearchConsoleId: e.target.value })} className="mt-1 font-mono" /></div>
                    </div>
                    <div><label className="text-sm font-medium">Facebook Pixel ID</label><Input value={settingsForm.facebookPixelId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, facebookPixelId: e.target.value })} className="mt-1 font-mono" /></div>
                    <div className="flex gap-2">
                      <Button onClick={() => { updateSettings.mutate(settingsForm); setSettingsForm(null); }} disabled={updateSettings.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                        {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Settings
                      </Button>
                      <Button variant="outline" onClick={() => setSettingsForm(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Meta Dialog */}
      <Dialog open={metaDialog} onOpenChange={(o) => !o && setMetaDialog(false)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingMeta ? "Edit Page Meta" : "Add Page Meta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Page Path</label><Input value={metaForm.pagePath} onChange={(e) => setMetaForm({ ...metaForm, pagePath: e.target.value })} placeholder="/shop" className="mt-1 font-mono" /></div>
            <div><label className="text-sm font-medium">Meta Title</label><Input value={metaForm.metaTitle} onChange={(e) => setMetaForm({ ...metaForm, metaTitle: e.target.value })} className="mt-1" /></div>
            <div><label className="text-sm font-medium">Meta Description</label><Textarea value={metaForm.metaDescription} onChange={(e) => setMetaForm({ ...metaForm, metaDescription: e.target.value })} rows={3} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">OG Title</label><Input value={metaForm.ogTitle} onChange={(e) => setMetaForm({ ...metaForm, ogTitle: e.target.value })} className="mt-1" /></div>
              <div><label className="text-sm font-medium">OG Image URL</label><Input value={metaForm.ogImage} onChange={(e) => setMetaForm({ ...metaForm, ogImage: e.target.value })} className="mt-1" /></div>
            </div>
            <div><label className="text-sm font-medium">Canonical URL</label><Input value={metaForm.canonicalUrl} onChange={(e) => setMetaForm({ ...metaForm, canonicalUrl: e.target.value })} className="mt-1 font-mono" /></div>
            <div className="flex items-center gap-3"><Switch checked={metaForm.noIndex} onCheckedChange={(v) => setMetaForm({ ...metaForm, noIndex: v })} /><label className="text-sm font-medium">noindex (hide from search engines)</label></div>
            <div><label className="text-sm font-medium">Structured Data (JSON-LD)</label><Textarea value={metaForm.structuredData} onChange={(e) => setMetaForm({ ...metaForm, structuredData: e.target.value })} rows={5} className="mt-1 font-mono text-xs" placeholder='{"@context":"https://schema.org",...}' /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetaDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!metaForm.pagePath) return toast.error("Page path is required");
              createMeta.mutate({ pageType: 'page' as const, metaTitle: metaForm.metaTitle, metaDescription: metaForm.metaDescription, ogTitle: metaForm.ogTitle, ogDescription: metaForm.ogDescription || undefined, ogImage: metaForm.ogImage || undefined, noIndex: metaForm.noIndex, canonicalUrl: metaForm.canonicalUrl || undefined });
            }} disabled={createMeta.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {createMeta.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redirect Dialog */}
      <Dialog open={redirDialog} onOpenChange={(o) => !o && setRedirDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRedir ? "Edit Redirect" : "New Redirect"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">From Path</label><Input value={redirForm.fromPath} onChange={(e) => setRedirForm({ ...redirForm, fromPath: e.target.value })} placeholder="/old-page" className="mt-1 font-mono" /></div>
            <div><label className="text-sm font-medium">To Path</label><Input value={redirForm.toPath} onChange={(e) => setRedirForm({ ...redirForm, toPath: e.target.value })} placeholder="/new-page" className="mt-1 font-mono" /></div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={redirForm.type} onValueChange={(v: any) => setRedirForm({ ...redirForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 (Permanent)</SelectItem>
                  <SelectItem value="302">302 (Temporary)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!redirForm.fromPath || !redirForm.toPath) return toast.error("Both paths required");
              if (editingRedir) { updateRedir.mutate({ id: editingRedir.id, ...redirForm }); } else { createRedir.mutate(redirForm); }
            }} disabled={createRedir.isPending || updateRedir.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createRedir.isPending || updateRedir.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRedir ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
