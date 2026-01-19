// Merge multiple images into one vertical long image

export const MERGE_OUTPUT_WIDTH = 556; // Match split output width

export interface MergeOptions {
  images: HTMLImageElement[];
}

export interface MergeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Merge multiple images vertically into one long image.
 * All images are scaled to MERGE_OUTPUT_WIDTH (556px) maintaining aspect ratio.
 */
export async function mergeImages(options: MergeOptions): Promise<MergeResult> {
  const { images } = options;

  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  // Calculate scaled dimensions for each image
  const scaledImages = images.map((img) => {
    const scale = MERGE_OUTPUT_WIDTH / img.naturalWidth;
    return {
      img,
      width: MERGE_OUTPUT_WIDTH,
      height: Math.round(img.naturalHeight * scale),
    };
  });

  // Calculate total height
  const totalHeight = scaledImages.reduce((sum, item) => sum + item.height, 0);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = MERGE_OUTPUT_WIDTH;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw each image
  let currentY = 0;
  for (const { img, width, height } of scaledImages) {
    ctx.drawImage(img, 0, currentY, width, height);
    currentY += height;
  }

  // Get data URL for preview
  const dataUrl = canvas.toDataURL('image/png');

  // Get blob for download
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/png');
  });

  return {
    blob,
    dataUrl,
    width: MERGE_OUTPUT_WIDTH,
    height: totalHeight,
  };
}
