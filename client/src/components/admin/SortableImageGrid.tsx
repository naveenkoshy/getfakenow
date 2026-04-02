/**
 * SortableImageGrid — Drag-and-drop reorderable image grid for products.
 *
 * Uses @dnd-kit/sortable for accessible drag-and-drop reordering.
 * Each image shows a thumbnail, drag handle, and delete button.
 *
 * Usage:
 *   <SortableImageGrid
 *     images={images}
 *     onReorder={(reorderedImages) => setImages(reorderedImages)}
 *     onDelete={(id) => handleDelete(id)}
 *   />
 */
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Star } from "lucide-react";

export interface SortableImage {
  id: number | string;
  url: string;
  altText?: string;
  /** Whether this is the primary/featured image */
  isPrimary?: boolean;
}

interface SortableImageGridProps {
  images: SortableImage[];
  onReorder: (images: SortableImage[]) => void;
  onDelete?: (id: number | string) => void;
  onSetPrimary?: (id: number | string) => void;
}

function SortableImageItem({
  image,
  onDelete,
  onSetPrimary,
}: {
  image: SortableImage;
  onDelete?: (id: number | string) => void;
  onSetPrimary?: (id: number | string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
        image.isPrimary ? "border-red-500" : "border-gray-200"
      } ${isDragging ? "shadow-lg" : "hover:shadow-md"} bg-white transition-shadow`}
    >
      <img
        src={image.url}
        alt={image.altText || "Product image"}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-black/50 text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Primary badge */}
      {image.isPrimary && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star className="h-3 w-3 fill-white" /> Primary
        </div>
      )}

      {/* Actions overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        {onSetPrimary && !image.isPrimary && (
          <button
            type="button"
            onClick={() => onSetPrimary(image.id)}
            className="text-white text-[10px] bg-white/20 hover:bg-white/30 rounded px-1.5 py-0.5 transition-colors"
            title="Set as primary image"
          >
            <Star className="h-3 w-3 inline mr-0.5" /> Primary
          </button>
        )}
        {image.isPrimary && <div />}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(image.id)}
            className="text-white bg-red-500/80 hover:bg-red-500 rounded p-1 transition-colors"
            title="Remove image"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  onSetPrimary,
}: SortableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(images, oldIndex, newIndex));
  };

  if (images.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((image) => (
            <SortableImageItem
              key={image.id}
              image={image}
              onDelete={onDelete}
              onSetPrimary={onSetPrimary}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
