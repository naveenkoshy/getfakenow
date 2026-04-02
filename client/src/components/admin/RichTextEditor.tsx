/**
 * RichTextEditor — Tiptap-based WYSIWYG editor for admin CMS.
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  className?: string;
  error?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing…",
  minHeight = 200,
  compact = false,
  className = "",
  error = false,
}: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    [onChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ...(compact
        ? []
        : [Table.configure({ resizable: true }), TableRow, TableCell, TableHeader]),
    ],
    content,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[inherit]",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current && content !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white ${
        error ? "border-red-500" : "border-gray-200"
      } focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-400 transition-colors ${className}`}
    >
      <EditorToolbar editor={editor} compact={compact} />
      <div style={{ minHeight }} className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
