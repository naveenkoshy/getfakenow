/**
 * MediaPicker — Reusable modal dialog for selecting media from the library.
 *
 * Used by PageBuilder, RichTextEditor, ProductForm, and Banners to pick
 * images/assets from the centralized media library without leaving the
 * current editor context.
 *
 * Usage:
 *   <MediaPicker
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={(url) => handleImage(url)}
 *   />
 */
import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Check,
  Loader2,
  Image as ImageIcon,
  FileImage,
  X,
} from "lucide-react";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  /** Called with the selected media URL(s) */
  onSelect: (url: string, item?: MediaItem) => void;
  /** Allow selecting multiple items */
  multiple?: boolean;
  /** Filter to specific mime type prefix (e.g., "image/") */
  accept?: string;
  /** Dialog title override */
  title?: string;
}

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  accept,
  title = "Select Media",
}: MediaPickerProps) {
  const { data: mediaItems, isLoading, refetch } = trpc.admin.media.list.useQuery(
    undefined,
    { enabled: open },
  );
  const uploadMut = trpc.admin.media.upload.useMutation({
    onSuccess: () => {
      toast.success("Uploaded successfully");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items by search and mime type
  const mediaList = Array.isArray(mediaItems) ? mediaItems : (mediaItems as any)?.media ?? [];
  const filteredItems = (mediaList as any[]).filter((item: any) => {
    if (accept && !item.mimeType?.startsWith(accept)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.filename?.toLowerCase().includes(q) ||
        item.altText?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (item: any) => {
    if (multiple) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } else {
      // Single select — immediately confirm
      onSelect(item.url, item);
      handleClose();
    }
  };

  const confirmMultiple = () => {
    const items = (mediaList as any[]).filter((i: any) => selected.has(i.id));
    items.forEach((item: any) => onSelect(item.url, item));
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setSelected(new Set());
    onClose();
  };

  const handleUpload = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 50MB limit`);
          continue;
        }
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        uploadMut.mutate({
          imageData: base64,
          fileName: file.name,
          mimeType: file.type,
          altText: "",
        });
      }
    },
    [uploadMut],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> {title}
          </DialogTitle>
          <DialogDescription>
            {multiple
              ? "Select one or more items from your media library."
              : "Click an item to select it."}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar: search + upload */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="pl-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMut.isPending}
          >
            {uploadMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept || "image/*,video/*,audio/*,.pdf,.doc,.docx"}
            multiple
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileImage className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {search ? "No items match your search." : "No media uploaded yet."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" /> Upload Files
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 p-1">
              {filteredItems.map((item: any) => {
                const isImage = item.mimeType?.startsWith("image/");
                const isSelected = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelect(item)}
                    className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {isImage ? (
                      <img
                        src={item.url}
                        alt={item.altText || item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                        <FileImage className="h-8 w-8 text-gray-400" />
                        <p className="text-[10px] text-gray-500 mt-1 truncate max-w-full px-1">
                          {item.filename}
                        </p>
                      </div>
                    )}
                    {/* Selection overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="bg-red-500 text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    {/* Filename tooltip on hover */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.filename}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {multiple && (
          <DialogFooter>
            <p className="text-sm text-gray-500 mr-auto">
              {selected.size} item{selected.size !== 1 ? "s" : ""} selected
            </p>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={confirmMultiple}
              disabled={selected.size === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Insert Selected
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
