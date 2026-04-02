/**
 * PageBuilder — Drag-and-drop visual page builder for admin CMS.
 *
 * Renders a sortable list of typed blocks (hero, text, image, productGrid,
 * cta, video, testimonial, faq, custom, spacer). Each block has an inline
 * property editor and a compact preview. Outputs a JSON array of PageBlock
 * objects that is stored in staticPages.blocksJson.
 */
import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical, Plus, Trash2, ChevronDown, ChevronUp,
  Layout, Type, Image, Grid3X3, MousePointerClick,
  Play, Quote, HelpCircle, Code, MoveVertical, Copy,
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { MediaPicker } from "./MediaPicker";
import { ProductPicker } from "./ProductPicker";
import type { PageBlock, BlockType } from "@shared/pageBlocks";
import { BLOCK_TYPE_META, getDefaultBlockProps } from "@shared/pageBlocks";

interface PageBuilderProps {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
}

const BLOCK_ICONS: Record<BlockType, React.ElementType> = {
  hero: Layout,
  text: Type,
  image: Image,
  productGrid: Grid3X3,
  cta: MousePointerClick,
  video: Play,
  testimonial: Quote,
  faq: HelpCircle,
  custom: Code,
  spacer: MoveVertical,
};

// ─── Sortable Block Wrapper ─────────────────────────────

function SortableBlock({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  block: PageBlock;
  onUpdate: (updated: PageBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = BLOCK_TYPE_META[block.type];
  const Icon = BLOCK_ICONS[block.type];

  return (
    <div ref={setNodeRef} style={style} className={`border border-gray-200 rounded-lg bg-white ${isDragging ? "shadow-lg" : ""}`}>
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
        <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 flex-1">{meta.label}</span>
        <button type="button" onClick={onDuplicate} className="text-gray-400 hover:text-gray-600 p-1" title="Duplicate block">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1" title="Delete block">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block editor */}
      {expanded && (
        <div className="p-4">
          <BlockEditor block={block} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

// ─── Block Editors ──────────────────────────────────────

function BlockEditor({ block, onUpdate }: { block: PageBlock; onUpdate: (b: PageBlock) => void }) {
  const [mediaPicker, setMediaPicker] = useState(false);
  const updateProps = (partial: Record<string, any>) => {
    onUpdate({ ...block, props: { ...block.props, ...partial } } as PageBlock);
  };

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Title</label>
            <Input value={block.props.title} onChange={(e) => updateProps({ title: e.target.value })} placeholder="Hero headline" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Subtitle</label>
            <Input value={block.props.subtitle || ""} onChange={(e) => updateProps({ subtitle: e.target.value })} placeholder="Supporting text" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Background Image</label>
            <div className="flex gap-2 mt-1">
              <Input value={block.props.imageUrl} onChange={(e) => updateProps({ imageUrl: e.target.value })} placeholder="https://..." className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setMediaPicker(true)}>Browse</Button>
            </div>
            {block.props.imageUrl && <img src={block.props.imageUrl} alt="" className="mt-2 h-24 w-full object-cover rounded" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">CTA Text</label>
              <Input value={block.props.ctaText || ""} onChange={(e) => updateProps({ ctaText: e.target.value })} placeholder="Shop Now" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">CTA Link</label>
              <Input value={block.props.ctaLink || ""} onChange={(e) => updateProps({ ctaLink: e.target.value })} placeholder="/shop" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Overlay Opacity: {block.props.overlayOpacity ?? 40}%</label>
            <Slider value={[block.props.overlayOpacity ?? 40]} onValueChange={([v]) => updateProps({ overlayOpacity: v })} min={0} max={100} step={5} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Text Color</label>
              <Input value={block.props.textColor || "#FFFFFF"} onChange={(e) => updateProps({ textColor: e.target.value })} type="color" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Text Align</label>
              <Select value={block.props.textAlign || "center"} onValueChange={(v) => updateProps({ textAlign: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <MediaPicker open={mediaPicker} onClose={() => setMediaPicker(false)} onSelect={(url) => updateProps({ imageUrl: url })} accept="image/" />
        </div>
      );

    case "text":
      return (
        <RichTextEditor
          content={block.props.content}
          onChange={(html) => updateProps({ content: html })}
          placeholder="Write your content here..."
          minHeight={150}
        />
      );

    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Image</label>
            <div className="flex gap-2 mt-1">
              <Input value={block.props.imageUrl} onChange={(e) => updateProps({ imageUrl: e.target.value })} placeholder="https://..." className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => setMediaPicker(true)}>Browse</Button>
            </div>
            {block.props.imageUrl && <img src={block.props.imageUrl} alt="" className="mt-2 max-h-40 rounded" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Alt Text</label>
              <Input value={block.props.altText || ""} onChange={(e) => updateProps({ altText: e.target.value })} placeholder="Image description" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Width</label>
              <Select value={block.props.width || "contained"} onValueChange={(v) => updateProps({ width: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="contained">Contained</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Caption</label>
            <Input value={block.props.caption || ""} onChange={(e) => updateProps({ caption: e.target.value })} placeholder="Optional caption" />
          </div>
          <MediaPicker open={mediaPicker} onClose={() => setMediaPicker(false)} onSelect={(url) => updateProps({ imageUrl: url })} accept="image/" />
        </div>
      );

    case "productGrid":
      return (
        <ProductGridEditor block={block} updateProps={updateProps} />
      );

    case "cta":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Title</label>
            <Input value={block.props.title} onChange={(e) => updateProps({ title: e.target.value })} placeholder="Call to action heading" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Description</label>
            <Textarea value={block.props.description || ""} onChange={(e) => updateProps({ description: e.target.value })} placeholder="Supporting text..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Button Text</label>
              <Input value={block.props.buttonText} onChange={(e) => updateProps({ buttonText: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Button Link</label>
              <Input value={block.props.buttonLink} onChange={(e) => updateProps({ buttonLink: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Background Color</label>
              <Input value={block.props.bgColor || "#DC2626"} onChange={(e) => updateProps({ bgColor: e.target.value })} type="color" className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Text Color</label>
              <Input value={block.props.textColor || "#FFFFFF"} onChange={(e) => updateProps({ textColor: e.target.value })} type="color" className="h-9" />
            </div>
          </div>
        </div>
      );

    case "video":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Video URL</label>
            <Input value={block.props.url} onChange={(e) => updateProps({ url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Caption</label>
            <Input value={block.props.caption || ""} onChange={(e) => updateProps({ caption: e.target.value })} placeholder="Optional caption" />
          </div>
        </div>
      );

    case "testimonial":
      return (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Quote</label>
            <Textarea value={block.props.quote} onChange={(e) => updateProps({ quote: e.target.value })} placeholder="Customer quote..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Author Name</label>
              <Input value={block.props.author} onChange={(e) => updateProps({ author: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Role / Title</label>
              <Input value={block.props.role || ""} onChange={(e) => updateProps({ role: e.target.value })} placeholder="Customer" />
            </div>
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          {block.props.items.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Question {i + 1}</span>
                {block.props.items.length > 1 && (
                  <button type="button" onClick={() => updateProps({ items: block.props.items.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Input value={item.question} onChange={(e) => {
                const items = [...block.props.items];
                items[i] = { ...items[i], question: e.target.value };
                updateProps({ items });
              }} placeholder="Question" />
              <Textarea value={item.answer} onChange={(e) => {
                const items = [...block.props.items];
                items[i] = { ...items[i], answer: e.target.value };
                updateProps({ items });
              }} placeholder="Answer" rows={2} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => updateProps({ items: [...block.props.items, { question: "", answer: "" }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
          </Button>
        </div>
      );

    case "custom":
      return (
        <div>
          <label className="text-xs font-medium text-gray-600">Raw HTML</label>
          <Textarea
            value={block.props.html}
            onChange={(e) => updateProps({ html: e.target.value })}
            placeholder="<div>Your custom HTML...</div>"
            rows={6}
            className="mt-1 font-mono text-xs"
          />
        </div>
      );

    case "spacer":
      return (
        <div>
          <label className="text-xs font-medium text-gray-600">Height: {block.props.height}px</label>
          <Slider
            value={[block.props.height]}
            onValueChange={([v]) => updateProps({ height: v })}
            min={8}
            max={200}
            step={8}
            className="mt-2"
          />
        </div>
      );

    default:
      return <p className="text-sm text-gray-500">Unknown block type</p>;
  }
}

// ─── Product Grid Editor (with ProductPicker) ────────────

function ProductGridEditor({ block, updateProps }: { block: any; updateProps: (p: any) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedIds: number[] = block.props.productIds || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600">Section Title</label>
        <Input value={block.props.title || ""} onChange={(e) => updateProps({ title: e.target.value })} placeholder="Featured Products" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Columns</label>
          <Select value={String(block.props.columns || 4)} onValueChange={(v) => updateProps({ columns: parseInt(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Max Products</label>
          <Input type="number" min={1} max={24} value={block.props.limit || 8} onChange={(e) => updateProps({ limit: parseInt(e.target.value) || 8 })} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Category ID (optional)</label>
        <Input type="number" value={block.props.categoryId || ""} onChange={(e) => updateProps({ categoryId: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Leave empty for all" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600">Hand-Picked Products (optional)</label>
        <div className="mt-1 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Pick Products"}
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-red-600" onClick={() => updateProps({ productIds: undefined })}>
              Clear
            </Button>
          )}
        </div>
        {selectedIds.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            IDs: {selectedIds.join(", ")} — These override category/limit filters.
          </p>
        )}
      </div>
      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ids) => updateProps({ productIds: ids.length > 0 ? ids : undefined })}
        selectedIds={selectedIds}
        multiple
        maxSelection={24}
      />
    </div>
  );
}

// ─── Main PageBuilder Component ─────────────────────────

export function PageBuilder({ blocks, onChange }: PageBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(blocks, oldIndex, newIndex));
  };

  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock: PageBlock = {
        id: nanoid(8),
        type,
        props: getDefaultBlockProps(type),
      } as PageBlock;
      onChange([...blocks, newBlock]);
    },
    [blocks, onChange],
  );

  const updateBlock = useCallback(
    (index: number, updated: PageBlock) => {
      const next = [...blocks];
      next[index] = updated;
      onChange(next);
    },
    [blocks, onChange],
  );

  const deleteBlock = useCallback(
    (index: number) => {
      onChange(blocks.filter((_, i) => i !== index));
    },
    [blocks, onChange],
  );

  const duplicateBlock = useCallback(
    (index: number) => {
      const original = blocks[index];
      const copy: PageBlock = {
        ...original,
        id: nanoid(8),
        props: { ...original.props },
      } as PageBlock;
      const next = [...blocks];
      next.splice(index + 1, 0, copy);
      onChange(next);
    },
    [blocks, onChange],
  );

  return (
    <div className="space-y-3">
      {blocks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blocks.map((block, index) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={(updated) => updateBlock(index, updated)}
                  onDelete={() => deleteBlock(index)}
                  onDuplicate={() => duplicateBlock(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layout className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">No blocks yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first block to start building the page.</p>
          </div>
        </Card>
      )}

      {/* Add Block Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" /> Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64">
          {(Object.keys(BLOCK_TYPE_META) as BlockType[]).map((type) => {
            const meta = BLOCK_TYPE_META[type];
            const Icon = BLOCK_ICONS[type];
            return (
              <DropdownMenuItem key={type} onClick={() => addBlock(type)} className="flex items-start gap-2 py-2">
                <Icon className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-gray-400">{meta.description}</p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
