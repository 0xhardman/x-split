'use client';

import { useState, useCallback, useMemo } from 'react';
import { calculateFitCrop, getTargetDimensionsV2, type DimensionConfig } from '@/lib/splitImage';

export interface CropState {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
}

interface UseCropControlsParams {
  image: HTMLImageElement | null;
  segments: 2 | 3 | 4;
  dimensionConfig: DimensionConfig;
}

interface UseCropControlsReturn {
  crop: CropState | null;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isModified: boolean;
  handleZoom: (newZoom: number) => void;
  handleZoomDelta: (delta: number) => void;
  handlePan: (deltaX: number, deltaY: number) => void;
  resetCrop: () => void;
}

// Generate a stable key for tracking config changes
function getConfigKey(image: HTMLImageElement | null, segments: number, config: DimensionConfig): string {
  if (!image) return 'null';
  const configStr = config.preset === 'twitter'
    ? `twitter-${config.mode}`
    : `custom-${config.custom?.width}-${config.custom?.segmentHeights.join(',')}-${config.custom?.gap}`;
  return `${image.src}-${image.naturalWidth}-${image.naturalHeight}-${segments}-${configStr}`;
}

export function useCropControls({
  image,
  segments,
  dimensionConfig,
}: UseCropControlsParams): UseCropControlsReturn {
  // Track config to reset when it changes
  const [lastConfigKey, setLastConfigKey] = useState<string>('');

  // User adjustments stored as offsets from baseCrop
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);

  // Min zoom = 1.0 (cannot zoom out beyond fit)
  // Max zoom = 5x (reasonable limit)
  const minZoom = 1.0;
  const maxZoom = 5.0;

  // Calculate base crop (auto-fit)
  const baseCrop = useMemo(() => {
    if (!image) return null;

    const target = getTargetDimensionsV2(segments, dimensionConfig);
    return calculateFitCrop(
      image.naturalWidth,
      image.naturalHeight,
      target.aspectRatio
    );
  }, [image, segments, dimensionConfig]);

  // Check if config changed and reset if needed
  const currentConfigKey = getConfigKey(image, segments, dimensionConfig);
  const configChanged = currentConfigKey !== lastConfigKey;

  // Calculate current crop from baseCrop + user adjustments
  const crop = useMemo((): CropState | null => {
    if (!baseCrop) return null;

    // If config changed, return baseCrop (reset state)
    const effectiveZoom = configChanged ? 1.0 : zoom;
    const effectivePanX = configChanged ? 0 : panOffset.x;
    const effectivePanY = configChanged ? 0 : panOffset.y;

    // Apply zoom: smaller width/height = zoomed in
    const newWidth = baseCrop.width / effectiveZoom;
    const newHeight = baseCrop.height / effectiveZoom;

    // Apply pan offset (relative to center)
    const centerX = baseCrop.x + baseCrop.width / 2 + effectivePanX;
    const centerY = baseCrop.y + baseCrop.height / 2 + effectivePanY;

    let x = centerX - newWidth / 2;
    let y = centerY - newHeight / 2;

    // Constrain to image bounds
    x = Math.max(0, Math.min(1 - newWidth, x));
    y = Math.max(0, Math.min(1 - newHeight, y));

    return { x, y, width: newWidth, height: newHeight };
  }, [baseCrop, panOffset, zoom, configChanged]);

  // Sync config key after render (done via handlers)
  const ensureConfigSynced = useCallback(() => {
    if (configChanged) {
      setLastConfigKey(currentConfigKey);
      setPanOffset({ x: 0, y: 0 });
      setZoom(1.0);
    }
  }, [configChanged, currentConfigKey]);

  // Check if crop has been modified from default
  const isModified = useMemo(() => {
    if (configChanged) return false;
    return Math.abs(panOffset.x) > 0.001 || Math.abs(panOffset.y) > 0.001 || Math.abs(zoom - 1.0) > 0.001;
  }, [panOffset, zoom, configChanged]);

  // Handle zoom change
  const handleZoom = useCallback((newZoom: number) => {
    ensureConfigSynced();
    if (!baseCrop) return;

    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clampedZoom);
  }, [baseCrop, minZoom, maxZoom, ensureConfigSynced]);

  // Handle zoom delta (for wheel events)
  const handleZoomDelta = useCallback((delta: number) => {
    ensureConfigSynced();
    const effectiveZoom = configChanged ? 1.0 : zoom;
    const newZoom = effectiveZoom * (1 + delta);
    handleZoom(newZoom);
  }, [zoom, handleZoom, configChanged, ensureConfigSynced]);

  // Handle pan (drag)
  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    ensureConfigSynced();
    if (!baseCrop) return;

    const effectiveZoom = configChanged ? 1.0 : zoom;
    const effectivePanX = configChanged ? 0 : panOffset.x;
    const effectivePanY = configChanged ? 0 : panOffset.y;

    // Calculate new pan offset (+ because dragging right should show content on the right)
    let newPanX = effectivePanX + deltaX;
    let newPanY = effectivePanY + deltaY;

    // Calculate bounds for pan offset
    const currentWidth = baseCrop.width / effectiveZoom;
    const currentHeight = baseCrop.height / effectiveZoom;

    const maxPanX = (1 - currentWidth) / 2 - baseCrop.x + baseCrop.width / 2;
    const minPanX = -(baseCrop.x + baseCrop.width / 2 - currentWidth / 2);
    const maxPanY = (1 - currentHeight) / 2 - baseCrop.y + baseCrop.height / 2;
    const minPanY = -(baseCrop.y + baseCrop.height / 2 - currentHeight / 2);

    newPanX = Math.max(minPanX, Math.min(maxPanX, newPanX));
    newPanY = Math.max(minPanY, Math.min(maxPanY, newPanY));

    setPanOffset({ x: newPanX, y: newPanY });
  }, [baseCrop, panOffset, zoom, configChanged, ensureConfigSynced]);

  // Reset to default crop
  const resetCrop = useCallback(() => {
    setLastConfigKey(currentConfigKey);
    setPanOffset({ x: 0, y: 0 });
    setZoom(1.0);
  }, [currentConfigKey]);

  return {
    crop,
    zoom: configChanged ? 1.0 : zoom,
    minZoom,
    maxZoom,
    canZoomIn: (configChanged ? 1.0 : zoom) < maxZoom,
    canZoomOut: (configChanged ? 1.0 : zoom) > minZoom,
    isModified,
    handleZoom,
    handleZoomDelta,
    handlePan,
    resetCrop,
  };
}
