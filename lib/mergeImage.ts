// Merge multiple images into one vertical long image

export type GapFillType = 'none' | 'blur' | 'solid';

export interface MergeOptions {
  images: HTMLImageElement[];
  gapFillType?: GapFillType;
  gapSize?: number;
  solidColor?: string;
  outputWidth?: number; // If not specified, uses max width from images
}

export interface MergeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Create a blurred version of a canvas region
 */
function createBlurredRegion(
  sourceCtx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  blurAmount: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw the source region
  ctx.drawImage(sourceCtx.canvas, x, y, width, height, 0, 0, width, height);

  // Apply blur filter
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';

  return canvas;
}

/**
 * Draw a gap fill between two images using blurred blend
 */
function drawBlurGapFill(
  ctx: CanvasRenderingContext2D,
  upperCanvas: HTMLCanvasElement,
  lowerCanvas: HTMLCanvasElement,
  gapY: number,
  gapHeight: number,
  width: number
): void {
  // Sample height from edges (use gap height or available height, whichever is smaller)
  const sampleHeight = Math.min(gapHeight * 2, 40);
  const blurAmount = Math.max(8, gapHeight / 3);

  // Get bottom edge of upper image
  const upperCtx = upperCanvas.getContext('2d')!;
  const upperEdgeY = Math.max(0, upperCanvas.height - sampleHeight);
  const upperBlurred = createBlurredRegion(
    upperCtx,
    0,
    upperEdgeY,
    width,
    Math.min(sampleHeight, upperCanvas.height),
    blurAmount
  );

  // Get top edge of lower image
  const lowerCtx = lowerCanvas.getContext('2d')!;
  const lowerBlurred = createBlurredRegion(
    lowerCtx,
    0,
    0,
    width,
    Math.min(sampleHeight, lowerCanvas.height),
    blurAmount
  );

  // Draw blended gap fill
  for (let y = 0; y < gapHeight; y++) {
    const ratio = y / gapHeight; // 0 at top, 1 at bottom

    // Upper blur fades out (1 -> 0), lower blur fades in (0 -> 1)
    ctx.globalAlpha = 1 - ratio;
    ctx.drawImage(
      upperBlurred,
      0, Math.max(0, sampleHeight - gapHeight + y), width, 1,
      0, gapY + y, width, 1
    );

    ctx.globalAlpha = ratio;
    ctx.drawImage(
      lowerBlurred,
      0, Math.min(y, lowerBlurred.height - 1), width, 1,
      0, gapY + y, width, 1
    );
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw a solid color gap fill
 */
function drawSolidGapFill(
  ctx: CanvasRenderingContext2D,
  gapY: number,
  gapHeight: number,
  width: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, gapY, width, gapHeight);
}

/**
 * Merge multiple images vertically into one long image.
 * By default, uses the maximum width from all input images, scaling smaller images up.
 * Optionally, a custom outputWidth can be specified.
 * Supports different gap fill types: none, blur blend, or solid color.
 */
export async function mergeImages(options: MergeOptions): Promise<MergeResult> {
  const { images, gapFillType = 'none', gapSize = 0, solidColor = '#000000', outputWidth } = options;

  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  const gapHeight = gapFillType !== 'none' ? gapSize : 0;
  const gapCount = images.length - 1;

  // Determine output width: use provided width, or max width from images
  const targetWidth = outputWidth ?? Math.max(...images.map(img => img.naturalWidth));

  // Calculate scaled dimensions for each image
  const scaledImages = images.map((img) => {
    const scale = targetWidth / img.naturalWidth;
    return {
      img,
      width: targetWidth,
      height: Math.round(img.naturalHeight * scale),
    };
  });

  // Calculate total height (including gaps if filling)
  const contentHeight = scaledImages.reduce((sum, item) => sum + item.height, 0);
  const totalHeight = contentHeight + gapHeight * gapCount;

  // Create individual canvases for each image (needed for gap fill)
  const imageCanvases: HTMLCanvasElement[] = [];
  for (const { img, width, height } of scaledImages) {
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = width;
    imgCanvas.height = height;
    const imgCtx = imgCanvas.getContext('2d')!;
    imgCtx.drawImage(img, 0, 0, width, height);
    imageCanvases.push(imgCanvas);
  }

  // Create final canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw each image and fill gaps
  let currentY = 0;
  for (let i = 0; i < scaledImages.length; i++) {
    const { width, height } = scaledImages[i];

    // Draw the image
    ctx.drawImage(imageCanvases[i], 0, currentY, width, height);
    currentY += height;

    // Fill gap after this image (except for the last one)
    if (gapFillType !== 'none' && gapHeight > 0 && i < scaledImages.length - 1) {
      if (gapFillType === 'blur') {
        drawBlurGapFill(
          ctx,
          imageCanvases[i],
          imageCanvases[i + 1],
          currentY,
          gapHeight,
          targetWidth
        );
      } else if (gapFillType === 'solid') {
        drawSolidGapFill(ctx, currentY, gapHeight, targetWidth, solidColor);
      }
      currentY += gapHeight;
    }
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
    width: targetWidth,
    height: totalHeight,
  };
}
