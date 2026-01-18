// Twitter display constants (measured from actual Twitter display)
export type DisplayMode = 'mobile' | 'desktop';

export const TWITTER_DISPLAY = {
  mobile: {
    width: 556,
    segmentHeight: 253,
    gap: 16,
  },
  desktop: {
    width: 556,
    segmentHeight: 253,
    gap: 57,
  },
} as const;

export function getDisplayConfig(mode: DisplayMode) {
  return TWITTER_DISPLAY[mode];
}

export interface SplitOptions {
  image: HTMLImageElement;
  segments: 2 | 3 | 4;
  mode: DisplayMode;
}

export interface SplitResult {
  blobs: Blob[];
  dataUrls: string[];
  segmentWidth: number;
  segmentHeight: number;
}

export interface TargetDimensions {
  width: number;
  totalHeight: number;      // Total height including gaps
  contentHeight: number;    // Total content height (excluding gaps)
  segmentHeight: number;
  gapCount: number;
  aspectRatio: number;      // Aspect ratio including gaps
}

/**
 * Calculate target dimensions for the image based on segment count.
 * The target includes gap space that will be removed during splitting.
 */
export function getTargetDimensions(segments: 2 | 3 | 4, mode: DisplayMode): TargetDimensions {
  const { width, segmentHeight, gap } = getDisplayConfig(mode);
  const gapCount = segments - 1;
  const contentHeight = segmentHeight * segments;
  const totalHeight = contentHeight + gap * gapCount;

  return {
    width,
    totalHeight,
    contentHeight,
    segmentHeight,
    gapCount,
    aspectRatio: width / totalHeight,
  };
}

/**
 * Calculate how to fit/crop the source image to target dimensions (including gap space).
 */
export function calculateFitCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: number
): { x: number; y: number; width: number; height: number } {
  const sourceAspectRatio = sourceWidth / sourceHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    // Source is wider than target - crop width (center crop)
    const newWidth = sourceHeight * targetAspectRatio;
    const cropWidth = newWidth / sourceWidth;
    return {
      x: (1 - cropWidth) / 2,
      y: 0,
      width: cropWidth,
      height: 1,
    };
  } else {
    // Source is taller than target - crop height (center crop)
    const newHeight = sourceWidth / targetAspectRatio;
    const cropHeight = newHeight / sourceHeight;
    return {
      x: 0,
      y: (1 - cropHeight) / 2,
      width: 1,
      height: cropHeight,
    };
  }
}

/**
 * Split an image into multiple segments for Twitter display.
 *
 * Process:
 * 1. Crop to target aspect ratio (including gap space: 556:1182 for 4 segments)
 * 2. Scale to Twitter display dimensions
 * 3. Split into segments, REMOVING the gap regions between them
 *
 * The gap regions are content that falls between segments - this content
 * is discarded so that when Twitter adds visual gaps, the image flows seamlessly.
 */
export async function splitImage(options: SplitOptions): Promise<SplitResult> {
  const { image, segments, mode } = options;

  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  // Get target dimensions (including gap space)
  const target = getTargetDimensions(segments, mode);
  const config = getDisplayConfig(mode);

  // Calculate crop area to match target aspect ratio
  const crop = calculateFitCrop(sourceWidth, sourceHeight, target.aspectRatio);

  // Calculate actual pixel coordinates for cropping
  const cropX = Math.floor(crop.x * sourceWidth);
  const cropY = Math.floor(crop.y * sourceHeight);
  const cropWidth = Math.floor(crop.width * sourceWidth);
  const cropHeight = Math.floor(crop.height * sourceHeight);

  // Calculate dimensions in source image coordinates
  // Source image represents: totalHeight (segments + gaps)
  // We need to extract segments and skip gaps
  const scale = cropHeight / target.totalHeight;
  const sourceSegmentHeight = target.segmentHeight * scale;
  const sourceGapHeight = config.gap * scale;

  // Output dimensions
  const outputWidth = target.width;
  const outputSegmentHeight = target.segmentHeight;

  const blobs: Blob[] = [];
  const dataUrls: string[] = [];

  for (let i = 0; i < segments; i++) {
    // Calculate source Y position for this segment
    // Each segment starts after: (previous segments) + (previous gaps)
    const sourceY = cropY + i * (sourceSegmentHeight + sourceGapHeight);

    // Create canvas for this segment
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputSegmentHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the segment (crop, skip gaps, and scale)
    ctx.drawImage(
      image,
      cropX, sourceY,                    // Source x, y
      cropWidth, sourceSegmentHeight,    // Source width, height (segment only, not gap)
      0, 0,                              // Destination x, y
      outputWidth, outputSegmentHeight   // Destination width, height
    );

    // Get data URL for preview
    const dataUrl = canvas.toDataURL('image/png');
    dataUrls.push(dataUrl);

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

    blobs.push(blob);
  }

  return {
    blobs,
    dataUrls,
    segmentWidth: outputWidth,
    segmentHeight: outputSegmentHeight,
  };
}

/**
 * Get preview info for displaying the crop area and result.
 */
export function getPreviewInfo(
  sourceWidth: number,
  sourceHeight: number,
  segments: 2 | 3 | 4,
  mode: DisplayMode
) {
  const target = getTargetDimensions(segments, mode);
  const crop = calculateFitCrop(sourceWidth, sourceHeight, target.aspectRatio);
  const sourceAspectRatio = sourceWidth / sourceHeight;

  return {
    target,
    crop,
    sourceAspectRatio,
    targetAspectRatio: target.aspectRatio,
    willCropWidth: sourceAspectRatio > target.aspectRatio,
    willCropHeight: sourceAspectRatio < target.aspectRatio,
  };
}
