import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, Search, ArrowRightLeft, Globe, Settings,
  HelpCircle, AlertTriangle, CheckCircle2, Eye
} from "lucide-react";
import { PageHeader, HelpText } from "@/components/admin/CmsUI";

export default function AdminSEO() {
  const { data: seoMetas, isLoading: metaLoading, refetch: refetchMeta } = trpc.admin.seo.list.useQuery();
  const { data: redirects, isLoading: redirLoading, refetch: refetchRedirects } = trpc.admin.seo.redirects.list.useQuery();
  const { data: allSettings, refetch: refetchSettings } = trpc.admin.settings.list.useQuery();
  const [tab, setTab] = useState("meta");

  // Meta state
  const [metaDialog, setMetaDialog] = useState(false);
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [metaForm, setMetaForm] = useState({ pagePath: "", metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "", noIndex: false, structuredData: "" });
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});

  const createMeta = trpc.admin.seo.upsert.useMutation({ onSuccess: () => { toast.success("SEO meta saved"); refetchMeta(); setMetaDialog(false); }, onError: (e: any) => toast.error(e.message) });

  // Redirect state
  const [redirDialog, setRedirDialog] = useState(false);
  const [editingRedir, setEditingRedir] = useState<any>(null);
  const [redirForm, setRedirForm] = useState({ fromPath: "", toPath: "", type: "301" as "301" | "302" });
  const [redirErrors, setRedirErrors] = useState<Record<string, string>>({});
  const [deleteRedirTarget, setDeleteRedirTarget] = useState<any>(null);

  const createRedir = trpc.admin.seo.redirects.create.useMutation({ onSuccess: () => { toast.success("Redirect created"); refetchRedirects(); setRedirDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const updateRedir = trpc.admin.seo.redirects.update.useMutation({ onSuccess: () => { toast.success("Redirect updated"); refetchRedirects(); setRedirDialog(false); }, onError: (e: any) => toast.error(e.message) });
  const deleteRedir = trpc.admin.seo.redirects.delete.useMutation({ onSuccess: () => { toast.success("Redirect deleted"); refetchRedirects(); setDeleteRedirTarget(null); }, onError: (e: any) => { toast.error(e.message); setDeleteRedirTarget(null); } });

  // Settings
  const updateSettings = trpc.admin.settings.set.useMutation({ onSuccess: () => { toast.success("SEO settings saved"); refetchSettings(); }, onError: (e: any) => toast.error(e.message) });
  const [settingsForm, setSettingsForm] = useState<any>(null);

  const titleCharCount = metaForm.metaTitle.length;
  const descCharCount = metaForm.metaDescription.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="SEO Management"
          description="Optimize search engine visibility, manage redirects, and configure global SEO settings"
        />

        {/* Help */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 px-4 text-sm text-blue-800">
            <p className="font-medium flex items-center gap-1"><HelpCircle className="h-4 w-4" /> About SEO</p>
            <p className="mt-1 text-blue-700">
              SEO (Search Engine Optimization) helps your store appear in Google and other search engines.
              Add page-specific meta tags for important pages, set up redirects for moved content, and configure global settings
              like Google Analytics and robots.txt. Meta titles should be 50-60 characters, descriptions 150-160 characters.
            </p>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="meta"><Globe className="h-4 w-4 mr-1" /> Page Meta</TabsTrigger>
            <TabsTrigger value="redirects"><ArrowRightLeft className="h-4 w-4 mr-1" /> Redirects</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" /> Global Settings</TabsTrigger>
          </TabsList>

          {/* Meta Tags Tab */}
          <TabsContent value="meta" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{seoMetas?.length || 0} page(s) with custom meta tags</p>
              <Button onClick={() => { setEditingMeta(null); setMetaForm({ pagePath: "", metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "", noIndex: false, structuredData: "" }); setMetaErrors({}); setMetaDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
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
                    <p className="text-sm mt-1 text-gray-400">Add page-specific meta tags for better search rankings. Start with your homepage and product pages.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {seoMetas.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 font-mono">{m.pagePath}</span>
                            {m.noIndex && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">noindex</span>}
                            {!m.noIndex && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">indexed</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">{m.metaTitle || "No title set"}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingMeta(m);
                          setMetaForm({ pagePath: m.pagePath, metaTitle: m.metaTitle || "", metaDescription: m.metaDescription || "", ogTitle: m.ogTitle || "", ogDescription: m.ogDescription || "", ogImage: m.ogImage || "", canonicalUrl: m.canonicalUrl || "", noIndex: m.noIndex || false, structuredData: m.structuredData || "" });
                          setMetaErrors({});
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
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">{redirects?.length || 0} redirect(s) configured</p>
              <Button onClick={() => { setEditingRedir(null); setRedirForm({ fromPath: "", toPath: "", type: "301" }); setRedirErrors({}); setRedirDialog(true); }} className="bg-red-600 hover:bg-red-700 text-white">
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
                    <p className="text-sm mt-1 text-gray-400">Set up redirects when you move or rename pages to preserve search rankings.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {redirects.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{r.fromPath}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.type === "301" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                              {r.type} {r.type === "301" ? "Permanent" : "Temporary"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">{r.toPath}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingRedir(r); setRedirForm({ fromPath: r.fromPath, toPath: r.toPath, type: r.type }); setRedirErrors({}); setRedirDialog(true); }} title="Edit"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteRedirTarget(r)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
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
              <CardHeader>
                <CardTitle className="text-lg">Global SEO Configuration</CardTitle>
                <p className="text-sm text-gray-500">Configure site-wide SEO settings, analytics, and crawling rules.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!settingsForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { key: "seo_title_suffix", label: "Title Suffix" },
                        { key: "ga_id", label: "Google Analytics" },
                        { key: "gsc_id", label: "Search Console" },
                        { key: "fb_pixel", label: "Facebook Pixel" },
                      ].map(item => {
                        const val = allSettings?.find((s: any) => s.key === item.key)?.value;
                        return (
                          <div key={item.key} className="flex items-center gap-2">
                            {val ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                            <span className="text-gray-600">{item.label}:</span>
                            <span className="font-medium text-gray-900">{val || "Not set"}</span>
                          </div>
                        );
                      })}
                    </div>
                    <Button onClick={() => setSettingsForm({
                      defaultTitleSuffix: allSettings?.find((s: any) => s.key === 'seo_title_suffix')?.value || ' | Fake by Freetown',
                      robotsTxt: allSettings?.find((s: any) => s.key === 'robots_txt')?.value || 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml',
                      sitemapEnabled: true,
                      googleAnalyticsId: allSettings?.find((s: any) => s.key === 'ga_id')?.value || '',
                      googleSearchConsoleId: allSettings?.find((s: any) => s.key === 'gsc_id')?.value || '',
                      facebookPixelId: allSettings?.find((s: any) => s.key === 'fb_pixel')?.value || '',
                    })} variant="outline">Edit Settings</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Default Title Suffix</label>
                      <Input value={settingsForm.defaultTitleSuffix || ""} onChange={(e) => setSettingsForm({ ...settingsForm, defaultTitleSuffix: e.target.value })} placeholder=" | Fake by Freetown" className="mt-1" />
                      <HelpText>Appended to all page titles (e.g., "Shop | Fake by Freetown"). Keep it short.</HelpText>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">robots.txt</label>
                      <Textarea value={settingsForm.robotsTxt || ""} onChange={(e) => setSettingsForm({ ...settingsForm, robotsTxt: e.target.value })} rows={5} className="mt-1 font-mono text-xs" />
                      <HelpText>Controls which pages search engines can crawl. Default allows all pages and includes sitemap.</HelpText>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={settingsForm.sitemapEnabled} onCheckedChange={(v) => setSettingsForm({ ...settingsForm, sitemapEnabled: v })} />
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Sitemap</label>
                        <p className="text-xs text-gray-400">Auto-generates /sitemap.xml for search engines to discover your pages.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Google Analytics ID</label>
                        <Input value={settingsForm.googleAnalyticsId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" className="mt-1 font-mono" />
                        <HelpText>From Google Analytics &gt; Admin &gt; Data Streams. Format: G-XXXXXXXXXX.</HelpText>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Search Console ID</label>
                        <Input value={settingsForm.googleSearchConsoleId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, googleSearchConsoleId: e.target.value })} className="mt-1 font-mono" />
                        <HelpText>Verification meta tag content from Google Search Console.</HelpText>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Facebook Pixel ID</label>
                      <Input value={settingsForm.facebookPixelId || ""} onChange={(e) => setSettingsForm({ ...settingsForm, facebookPixelId: e.target.value })} className="mt-1 font-mono" />
                      <HelpText>From Facebook Events Manager. Used for conversion tracking and retargeting ads.</HelpText>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
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
      <Dialog open={metaDialog} onOpenChange={(o) => { if (!o) setMetaDialog(false); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeta ? "Edit Page Meta" : "Add Page Meta"}</DialogTitle>
            <DialogDescription>Configure SEO meta tags for a specific page. These override the global defaults.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Page Path <span className="text-red-500">*</span></label>
              <Input value={metaForm.pagePath} onChange={(e) => setMetaForm({ ...metaForm, pagePath: e.target.value })} placeholder="/shop" className="mt-1 font-mono" />
              <HelpText>The URL path of the page (e.g., /shop, /about, /products/category-name).</HelpText>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Meta Title</label>
              <Input value={metaForm.metaTitle} onChange={(e) => setMetaForm({ ...metaForm, metaTitle: e.target.value })} className="mt-1" />
              <div className="flex justify-between mt-1">
                <HelpText>The title shown in search results and browser tabs. Aim for 50-60 characters.</HelpText>
                <span className={`text-xs ${titleCharCount > 60 ? "text-red-500" : titleCharCount > 50 ? "text-amber-500" : "text-green-500"}`}>{titleCharCount}/60</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Meta Description</label>
              <Textarea value={metaForm.metaDescription} onChange={(e) => setMetaForm({ ...metaForm, metaDescription: e.target.value })} rows={3} className="mt-1" />
              <div className="flex justify-between mt-1">
                <HelpText>The description shown below the title in search results. Aim for 150-160 characters.</HelpText>
                <span className={`text-xs ${descCharCount > 160 ? "text-red-500" : descCharCount > 150 ? "text-amber-500" : "text-green-500"}`}>{descCharCount}/160</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">OG Title</label>
                <Input value={metaForm.ogTitle} onChange={(e) => setMetaForm({ ...metaForm, ogTitle: e.target.value })} className="mt-1" />
                <HelpText>Title for social media shares. Falls back to meta title.</HelpText>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">OG Image URL</label>
                <Input value={metaForm.ogImage} onChange={(e) => setMetaForm({ ...metaForm, ogImage: e.target.value })} className="mt-1" />
                <HelpText>Image shown when shared on social media (1200x630px).</HelpText>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Canonical URL</label>
              <Input value={metaForm.canonicalUrl} onChange={(e) => setMetaForm({ ...metaForm, canonicalUrl: e.target.value })} className="mt-1 font-mono" />
              <HelpText>The preferred URL for this page. Use when the same content exists at multiple URLs to avoid duplicate content penalties.</HelpText>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <Switch checked={metaForm.noIndex} onCheckedChange={(v) => setMetaForm({ ...metaForm, noIndex: v })} />
              <div>
                <label className="text-sm font-medium text-gray-700">noindex</label>
                <p className="text-xs text-gray-400">When enabled, search engines will not index this page. Use for private or temporary pages.</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Structured Data (JSON-LD)</label>
              <Textarea value={metaForm.structuredData} onChange={(e) => setMetaForm({ ...metaForm, structuredData: e.target.value })} rows={5} className="mt-1 font-mono text-xs" placeholder='{"@context":"https://schema.org",...}' />
              <HelpText>Rich snippet data for search engines. Must be valid JSON-LD. Use schema.org types like Product, Organization, etc.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetaDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!metaForm.pagePath) { toast.error("Page path is required"); return; }
              createMeta.mutate({ pageType: 'page' as const, metaTitle: metaForm.metaTitle, metaDescription: metaForm.metaDescription, ogTitle: metaForm.ogTitle, ogDescription: metaForm.ogDescription || undefined, ogImage: metaForm.ogImage || undefined, noIndex: metaForm.noIndex, canonicalUrl: metaForm.canonicalUrl || undefined });
            }} disabled={createMeta.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {createMeta.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redirect Dialog */}
      <Dialog open={redirDialog} onOpenChange={(o) => { if (!o) setRedirDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRedir ? "Edit Redirect" : "New Redirect"}</DialogTitle>
            <DialogDescription>
              {editingRedir ? "Update the redirect rule." : "Create a redirect to forward visitors from an old URL to a new one."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">From Path <span className="text-red-500">*</span></label>
              <Input value={redirForm.fromPath} onChange={(e) => setRedirForm({ ...redirForm, fromPath: e.target.value })} placeholder="/old-page" className="mt-1 font-mono" />
              <HelpText>The old URL path that should redirect. Must start with /.</HelpText>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">To Path <span className="text-red-500">*</span></label>
              <Input value={redirForm.toPath} onChange={(e) => setRedirForm({ ...redirForm, toPath: e.target.value })} placeholder="/new-page" className="mt-1 font-mono" />
              <HelpText>The destination URL path. Can be a relative path or full URL.</HelpText>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Redirect Type</label>
              <Select value={redirForm.type} onValueChange={(v: any) => setRedirForm({ ...redirForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — Permanent (recommended for moved pages)</SelectItem>
                  <SelectItem value="302">302 — Temporary (for seasonal or A/B testing)</SelectItem>
                </SelectContent>
              </Select>
              <HelpText>301 transfers SEO value to the new URL. 302 tells search engines the original URL may return.</HelpText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!redirForm.fromPath || !redirForm.toPath) { toast.error("Both paths are required"); return; }
              if (redirForm.fromPath === redirForm.toPath) { toast.error("From and To paths cannot be the same"); return; }
              if (editingRedir) { updateRedir.mutate({ id: editingRedir.id, ...redirForm }); } else { createRedir.mutate(redirForm); }
            }} disabled={createRedir.isPending || updateRedir.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {(createRedir.isPending || updateRedir.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRedir ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Redirect Confirmation */}
      <AlertDialog open={!!deleteRedirTarget} onOpenChange={(o) => { if (!o) setDeleteRedirTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Delete Redirect
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the redirect from <strong className="font-mono">{deleteRedirTarget?.fromPath}</strong> to <strong className="font-mono">{deleteRedirTarget?.toPath}</strong>?
              Visitors to the old URL will see a 404 error.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRedir.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteRedir.isPending}
              onClick={(e) => { e.preventDefault(); if (deleteRedirTarget) deleteRedir.mutate({ id: deleteRedirTarget.id }); }}
            >
              {deleteRedir.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete Redirect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
