'use client';

import { useCallback, useState, useRef } from 'react';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  image: HTMLImageElement;
}

interface MergeUploaderProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
}

export type { ImageItem };

/**
 * Load an image from a URL and convert it to an ImageItem
 */
export async function loadImageFromUrl(url: string, index: number): Promise<ImageItem> {
  // Fetch the image
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();

  // Extract filename from URL or generate one
  const urlPath = new URL(url).pathname;
  const filename = urlPath.split('/').pop() || `twitter-image-${index + 1}.jpg`;

  // Create a File object from the blob
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  // Create object URL for preview (more reliable than data URL for large images)
  const objectUrl = URL.createObjectURL(blob);

  // Load the image element first
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });

  // Convert to data URL for preview (needed for persistence)
  const preview = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(blob);
  });

  // Clean up the object URL
  URL.revokeObjectURL(objectUrl);

  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
    file,
    preview,
    image,
  };
}

export default function MergeUploader({
  images,
  onImagesChange,
  maxImages = 4,
}: MergeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  const handleFiles = useCallback(async (files: FileList, currentImages: ImageItem[]) => {
    const remainingSlots = maxImages - currentImages.length;
    const filesToProcess = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    // Process all files in parallel
    const newImages = await Promise.all(
      filesToProcess.map(async (file, i) => {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const image = await new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = preview;
        });

        return {
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          file,
          preview,
          image,
        };
      })
    );

    onImagesChange([...currentImages, ...newImages]);
  }, [maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, images);
    }
  }, [handleFiles, images]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files, images);
    }
    e.target.value = '';
  }, [handleFiles, images]);

  const handleRemove = useCallback((id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  }, [images, onImagesChange]);

  // Drag and drop reordering
  const handleItemDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleItemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragItemRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    onImagesChange(newImages);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const handleItemDragEnd = () => {
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative rounded-xl p-5 cursor-pointer transition-all duration-300
            ${isDragging ? 'upload-zone-active' : 'upload-zone'}
          `}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-center space-y-3 py-3">
            <div
              className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: 'var(--text-muted)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {images.length === 0 ? 'Drop images here' : 'Add more images'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {images.length}/{maxImages} images • Click or drag to add
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Drag to reorder • Top to bottom order
            </p>
            <button
              onClick={() => onImagesChange([])}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255, 80, 80, 0.15)',
                color: '#ff6b6b',
                border: '1px solid rgba(255, 80, 80, 0.3)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {images.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleItemDragStart(index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleItemDragEnd}
                className={`
                  flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing
                  transition-all duration-200
                  ${dragOverIndex === index ? 'ring-2 ring-[var(--accent)]' : ''}
                `}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Drag handle */}
                <div className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Order number */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                  }}
                >
                  {index + 1}
                </div>

                {/* Preview thumbnail */}
                <img
                  src={item.preview}
                  alt={`Image ${index + 1}`}
                  className="w-12 h-12 object-cover rounded"
                />

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.file.name}
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {item.image.naturalWidth} × {item.image.naturalHeight}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-elevated)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
