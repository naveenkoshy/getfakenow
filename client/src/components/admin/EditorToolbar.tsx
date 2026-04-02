/**
 * EditorToolbar — Toolbar UI for the Tiptap RichTextEditor.
 * Built with shadcn components to match the admin design system.
 */
import type { Editor } from "@tiptap/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Code,
  Link as LinkIcon, Unlink, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Paintbrush, Highlighter, Table as TableIcon,
  Plus, Minus, Undo, Redo, RemoveFormatting,
} from "lucide-react";

interface EditorToolbarProps { editor: Editor; compact?: boolean; }

const COLORS = [
  "#000000", "#374151", "#6B7280", "#DC2626", "#EA580C",
  "#CA8A04", "#16A34A", "#0891B2", "#2563EB", "#7C3AED",
  "#DB2777", "#FFFFFF",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#BBF7D0", "#BFDBFE", "#E9D5FF",
  "#FECDD3", "#FED7AA", "#CCFBF1", "#F3F4F6",
];

function ToolbarButton({ onClick, active = false, disabled = false, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >{children}</button>
  );
}

export function EditorToolbar({ editor, compact = false }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const iconSize = "h-4 w-4";

  const setLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkUrl("");
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!imageUrl.trim()) return;
    const url = imageUrl.startsWith("http") ? imageUrl : `https://${imageUrl}`;
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl("");
    setImageOpen(false);
  }, [editor, imageUrl]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50/80">
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)"><Undo className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)"><Redo className={iconSize} /></ToolbarButton>
      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)"><Bold className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)"><Italic className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)"><Underline className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough className={iconSize} /></ToolbarButton>
      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1"><Heading1 className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 className={iconSize} /></ToolbarButton>
      {!compact && <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4"><Heading4 className={iconSize} /></ToolbarButton>}
      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists & Blocks */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><List className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List"><ListOrdered className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"><Quote className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block"><Code className={iconSize} /></ToolbarButton>
      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left"><AlignLeft className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center"><AlignCenter className={iconSize} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right"><AlignRight className={iconSize} /></ToolbarButton>
      {!compact && <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify"><AlignJustify className={iconSize} /></ToolbarButton>}
      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Link Popover */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <button type="button" title="Insert Link"
            className={`p-1.5 rounded-md transition-colors ${editor.isActive("link") ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"}`}
            onClick={() => { setLinkUrl(editor.getAttributes("link").href || ""); setLinkOpen(true); }}>
            <LinkIcon className={iconSize} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">URL</label>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" onKeyDown={(e) => e.key === "Enter" && setLink()} autoFocus />
            <div className="flex gap-2 justify-end">
              {editor.isActive("link") && (
                <Button variant="ghost" size="sm" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }}>
                  <Unlink className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              )}
              <Button size="sm" onClick={setLink}>Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Image Popover */}
      <Popover open={imageOpen} onOpenChange={setImageOpen}>
        <PopoverTrigger asChild>
          <button type="button" title="Insert Image" className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors">
            <ImageIcon className={iconSize} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Image URL</label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" onKeyDown={(e) => e.key === "Enter" && insertImage()} autoFocus />
            <div className="flex justify-end"><Button size="sm" onClick={insertImage}>Insert</Button></div>
          </div>
        </PopoverContent>
      </Popover>

      {!compact && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" title="Text Color" className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"><Paintbrush className={iconSize} /></button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Text Color</p>
              <div className="grid grid-cols-6 gap-1">
                {COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <button type="button" onClick={() => editor.chain().focus().unsetColor().run()} className="text-xs text-gray-500 hover:text-gray-700 mt-1.5">Reset color</button>
            </PopoverContent>
          </Popover>
          {/* Highlight */}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" title="Highlight" className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"><Highlighter className={iconSize} /></button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Highlight</p>
              <div className="grid grid-cols-4 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button key={color} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} className="text-xs text-gray-500 hover:text-gray-700 mt-1.5">Remove highlight</button>
            </PopoverContent>
          </Popover>
          {/* Table */}
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" title="Table" className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"><TableIcon className={iconSize} /></button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Table</p>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  <Plus className="h-3 w-3 mr-1.5" /> Insert 3x3 Table
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>
                  <Plus className="h-3 w-3 mr-1.5" /> Add Column
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>
                  <Plus className="h-3 w-3 mr-1.5" /> Add Row
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()}>
                  <Minus className="h-3 w-3 mr-1.5" /> Delete Column
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()}>
                  <Minus className="h-3 w-3 mr-1.5" /> Delete Row
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs text-red-600" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}>
                  <Minus className="h-3 w-3 mr-1.5" /> Delete Table
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
      <Separator orientation="vertical" className="h-6 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting"><RemoveFormatting className={iconSize} /></ToolbarButton>
    </div>
  );
}
