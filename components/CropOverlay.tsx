'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CropState } from '@/hooks/useCropControls';
import { getTargetDimensions, getDisplayConfig, type DisplayMode } from '@/lib/splitImage';

interface CropOverlayProps {
  image: HTMLImageElement;
  crop: CropState;
  segments: 2 | 3 | 4;
  mode: DisplayMode;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoomDelta: (delta: number) => void;
}

export default function CropOverlay({
  image,
  crop,
  segments,
  mode,
  onPan,
  onZoomDelta,
}: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const config = getDisplayConfig(mode);
  const target = getTargetDimensions(segments, mode);

  // Draw the image with crop overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    // Calculate image display size (fit to container)
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = rect.width / rect.height;

    let displayWidth: number;
    let displayHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (imageAspect > containerAspect) {
      // Image is wider than container
      displayWidth = rect.width;
      displayHeight = rect.width / imageAspect;
      offsetX = 0;
      offsetY = (rect.height - displayHeight) / 2;
    } else {
      // Image is taller than container
      displayHeight = rect.height;
      displayWidth = rect.height * imageAspect;
      offsetX = (rect.width - displayWidth) / 2;
      offsetY = 0;
    }

    // Clear canvas
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw the full image
    ctx.drawImage(image, offsetX, offsetY, displayWidth, displayHeight);

    // Draw darkened overlay outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

    // Calculate crop rectangle in display coordinates
    const cropX = offsetX + crop.x * displayWidth;
    const cropY = offsetY + crop.y * displayHeight;
    const cropW = crop.width * displayWidth;
    const cropH = crop.height * displayHeight;

    // Draw overlay around crop area (4 rectangles)
    // Top
    ctx.fillRect(offsetX, offsetY, displayWidth, cropY - offsetY);
    // Bottom
    ctx.fillRect(offsetX, cropY + cropH, displayWidth, displayHeight - (cropY - offsetY + cropH));
    // Left
    ctx.fillRect(offsetX, cropY, cropX - offsetX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, displayWidth - (cropX - offsetX + cropW), cropH);

    // Draw crop border
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Draw segment divider lines
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const segmentHeightRatio = target.segmentHeight / target.totalHeight;
    const gapHeightRatio = config.gap / target.totalHeight;

    for (let i = 1; i < segments; i++) {
      // Position of gap start
      const gapStartRatio = i * segmentHeightRatio + (i - 1) * gapHeightRatio;
      const gapEndRatio = gapStartRatio + gapHeightRatio;

      // Draw gap indicator
      const gapStartY = cropY + gapStartRatio * cropH;
      const gapEndY = cropY + gapEndRatio * cropH;

      ctx.strokeRect(cropX + 2, gapStartY, cropW - 4, gapEndY - gapStartY);
    }

    ctx.setLineDash([]);

    // Draw corner handles
    const handleSize = 12;
    ctx.fillStyle = 'var(--accent)';

    // Top-left
    ctx.fillRect(cropX - 2, cropY - 2, handleSize, 3);
    ctx.fillRect(cropX - 2, cropY - 2, 3, handleSize);

    // Top-right
    ctx.fillRect(cropX + cropW - handleSize + 2, cropY - 2, handleSize, 3);
    ctx.fillRect(cropX + cropW - 1, cropY - 2, 3, handleSize);

    // Bottom-left
    ctx.fillRect(cropX - 2, cropY + cropH - 1, handleSize, 3);
    ctx.fillRect(cropX - 2, cropY + cropH - handleSize + 2, 3, handleSize);

    // Bottom-right
    ctx.fillRect(cropX + cropW - handleSize + 2, cropY + cropH - 1, handleSize, 3);
    ctx.fillRect(cropX + cropW - 1, cropY + cropH - handleSize + 2, 3, handleSize);

  }, [image, crop, segments, mode, config, target]);

  // Get display dimensions for coordinate conversion
  const getDisplayDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const imageAspect = image.naturalWidth / image.naturalHeight;
    const containerAspect = rect.width / rect.height;

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspect > containerAspect) {
      displayWidth = rect.width;
      displayHeight = rect.width / imageAspect;
    } else {
      displayHeight = rect.height;
      displayWidth = rect.height * imageAspect;
    }

    return { displayWidth, displayHeight };
  }, [image]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !lastPosRef.current) return;

    const dims = getDisplayDimensions();
    if (!dims) return;

    // Convert mouse delta to normalized coordinates
    const deltaX = (e.clientX - lastPosRef.current.x) / dims.displayWidth;
    const deltaY = (e.clientY - lastPosRef.current.y) / dims.displayHeight;

    onPan(deltaX, deltaY);

    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, getDisplayDimensions, onPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      lastPosRef.current = null;
    }
  }, [isDragging]);

  // Wheel event for zoom (scroll up = zoom in, scroll down = zoom out)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    onZoomDelta(delta);
  }, [onZoomDelta]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !lastPosRef.current || e.touches.length !== 1) return;

    const dims = getDisplayDimensions();
    if (!dims) return;

    const touch = e.touches[0];
    const deltaX = (touch.clientX - lastPosRef.current.x) / dims.displayWidth;
    const deltaY = (touch.clientY - lastPosRef.current.y) / dims.displayHeight;

    onPan(deltaX, deltaY);

    lastPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, [isDragging, getDisplayDimensions, onPan]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastPosRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />

      {/* Instructions overlay */}
      <div
        className="absolute bottom-3 left-3 text-xs px-2 py-1 rounded"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'var(--text-muted)',
        }}
      >
        Drag to pan • Scroll to zoom
      </div>
    </div>
  );
}
