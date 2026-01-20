// Twitter display constants (measured from actual Twitter display)
export type DisplayMode = 'mobile' | 'desktop';
export type PresetType = 'twitter' | 'custom';

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

export interface CustomDimensions {
  width: number;              // Shared width for all segments
  segmentHeights: number[];   // Height per segment (length = segment count)
  gap: number;                // Gap size between segments
}

export interface DimensionConfig {
  preset: PresetType;
  mode: DisplayMode;          // For 'twitter' preset
  custom?: CustomDimensions;  // For 'custom' preset
}

export function getDisplayConfig(mode: DisplayMode) {
  return TWITTER_DISPLAY[mode];
}

export interface SplitOptions {
  image: HTMLImageElement;
  segments: 2 | 3 | 4;
  mode: DisplayMode;
  customCrop?: { x: number; y: number; width: number; height: number };
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

export interface TargetDimensionsV2 {
  width: number;
  totalHeight: number;      // Total height including gaps
  contentHeight: number;    // Total content height (excluding gaps)
  segmentHeights: number[]; // Variable heights per segment
  gap: number;
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
  const { image, segments, mode, customCrop } = options;

  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  // Get target dimensions (including gap space)
  const target = getTargetDimensions(segments, mode);
  const config = getDisplayConfig(mode);

  // Use custom crop if provided, otherwise calculate auto-fit crop
  const crop = customCrop ?? calculateFitCrop(sourceWidth, sourceHeight, target.aspectRatio);

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

// =============================================
// V2 API: Support for custom dimensions
// =============================================

export interface SplitOptionsV2 {
  image: HTMLImageElement;
  segments: 2 | 3 | 4;
  dimensionConfig: DimensionConfig;
  customCrop?: { x: number; y: number; width: number; height: number };
}

export interface SplitResultV2 {
  blobs: Blob[];
  dataUrls: string[];
  segmentWidth: number;
  segmentHeights: number[];  // Variable heights per segment
}

/**
 * Calculate target dimensions for the image using DimensionConfig.
 * Supports both Twitter preset and custom dimensions.
 */
export function getTargetDimensionsV2(
  segments: 2 | 3 | 4,
  config: DimensionConfig
): TargetDimensionsV2 {
  if (config.preset === 'twitter') {
    const { width, segmentHeight, gap } = getDisplayConfig(config.mode);
    const gapCount = segments - 1;
    const segmentHeights = Array(segments).fill(segmentHeight);
    const contentHeight = segmentHeight * segments;
    const totalHeight = contentHeight + gap * gapCount;

    return {
      width,
      totalHeight,
      contentHeight,
      segmentHeights,
      gap,
      gapCount,
      aspectRatio: width / totalHeight,
    };
  }

  // Custom dimensions
  const custom = config.custom!;
  const { width, gap } = custom;
  // Use provided segmentHeights, ensuring correct length
  const segmentHeights = custom.segmentHeights.slice(0, segments);
  // Pad with last value if not enough heights provided
  while (segmentHeights.length < segments) {
    segmentHeights.push(segmentHeights[segmentHeights.length - 1] || 253);
  }

  const gapCount = segments - 1;
  const contentHeight = segmentHeights.reduce((sum, h) => sum + h, 0);
  const totalHeight = contentHeight + gap * gapCount;

  return {
    width,
    totalHeight,
    contentHeight,
    segmentHeights,
    gap,
    gapCount,
    aspectRatio: width / totalHeight,
  };
}

/**
 * Split an image into multiple segments using V2 configuration.
 * Supports variable heights per segment.
 */
export async function splitImageV2(options: SplitOptionsV2): Promise<SplitResultV2> {
  const { image, segments, dimensionConfig, customCrop } = options;

  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;

  // Get target dimensions (including gap space)
  const target = getTargetDimensionsV2(segments, dimensionConfig);

  // Use custom crop if provided, otherwise calculate auto-fit crop
  const crop = customCrop ?? calculateFitCrop(sourceWidth, sourceHeight, target.aspectRatio);

  // Calculate actual pixel coordinates for cropping
  const cropX = Math.floor(crop.x * sourceWidth);
  const cropY = Math.floor(crop.y * sourceHeight);
  const cropWidth = Math.floor(crop.width * sourceWidth);
  const cropHeight = Math.floor(crop.height * sourceHeight);

  // Scale factor: source pixels per target pixel
  const scale = cropHeight / target.totalHeight;
  const sourceGapHeight = target.gap * scale;

  // Output dimensions
  const outputWidth = target.width;

  const blobs: Blob[] = [];
  const dataUrls: string[] = [];

  // Track cumulative Y position in source
  let sourceYCurrent = cropY;

  for (let i = 0; i < segments; i++) {
    const segmentHeight = target.segmentHeights[i];
    const sourceSegmentHeight = segmentHeight * scale;

    // Create canvas for this segment
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = segmentHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the segment (crop, skip gaps, and scale)
    ctx.drawImage(
      image,
      cropX, sourceYCurrent,              // Source x, y
      cropWidth, sourceSegmentHeight,     // Source width, height (segment only, not gap)
      0, 0,                               // Destination x, y
      outputWidth, segmentHeight          // Destination width, height
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

    // Move past this segment and the gap (except for last segment)
    sourceYCurrent += sourceSegmentHeight;
    if (i < segments - 1) {
      sourceYCurrent += sourceGapHeight;
    }
  }

  return {
    blobs,
    dataUrls,
    segmentWidth: outputWidth,
    segmentHeights: target.segmentHeights,
  };
}

/**
 * Get preview info using V2 configuration.
 */
export function getPreviewInfoV2(
  sourceWidth: number,
  sourceHeight: number,
  segments: 2 | 3 | 4,
  dimensionConfig: DimensionConfig
) {
  const target = getTargetDimensionsV2(segments, dimensionConfig);
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

/**
 * Create a default DimensionConfig for Twitter preset.
 */
export function createDefaultDimensionConfig(mode: DisplayMode = 'mobile'): DimensionConfig {
  return {
    preset: 'twitter',
    mode,
  };
}

/**
 * Create a DimensionConfig for custom dimensions.
 */
export function createCustomDimensionConfig(
  width: number,
  segmentHeights: number[],
  gap: number
): DimensionConfig {
  return {
    preset: 'custom',
    mode: 'mobile', // Not used for custom, but required field
    custom: {
      width,
      segmentHeights,
      gap,
    },
  };
}
