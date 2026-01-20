'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { CropState } from '@/hooks/useCropControls';
import { getTargetDimensionsV2, type DimensionConfig } from '@/lib/splitImage';

type DragMode =
  | 'none'
  | 'pan'
  | 'resize-left'
  | 'resize-right'
  | 'resize-top'
  | 'resize-bottom'
  | 'resize-corner-tl'
  | 'resize-corner-tr'
  | 'resize-corner-bl'
  | 'resize-corner-br'
  | `divider-${number}`;

interface CropOverlayProps {
  image: HTMLImageElement;
  crop: CropState;
  segments: 2 | 3 | 4;
  dimensionConfig: DimensionConfig;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoomDelta: (delta: number) => void;
  onDimensionChange?: (width: number, segmentHeights: number[], gap: number) => void;
}

export default function CropOverlay({
  image,
  crop,
  segments,
  dimensionConfig,
  onPan,
  onZoomDelta,
  onDimensionChange,
}: CropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [hoverMode, setHoverMode] = useState<DragMode>('none');
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const displayInfoRef = useRef<{
    offsetX: number;
    offsetY: number;
    displayWidth: number;
    displayHeight: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  } | null>(null);

  const target = getTargetDimensionsV2(segments, dimensionConfig);
  const isCustomMode = dimensionConfig.preset === 'custom';

  // Get cursor based on mode
  const getCursor = (mode: DragMode): string => {
    if (!isCustomMode && mode !== 'pan' && mode !== 'none') return 'grab';
    switch (mode) {
      case 'resize-left':
      case 'resize-right':
        return 'ew-resize';
      case 'resize-top':
      case 'resize-bottom':
        return 'ns-resize';
      case 'resize-corner-tl':
      case 'resize-corner-br':
        return 'nwse-resize';
      case 'resize-corner-tr':
      case 'resize-corner-bl':
        return 'nesw-resize';
      case 'pan':
        return 'grabbing';
      default:
        if (mode.startsWith('divider-')) return 'ns-resize';
        return 'grab';
    }
  };

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
      displayWidth = rect.width;
      displayHeight = rect.width / imageAspect;
      offsetX = 0;
      offsetY = (rect.height - displayHeight) / 2;
    } else {
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

    // Store display info for hit detection
    displayInfoRef.current = { offsetX, offsetY, displayWidth, displayHeight, cropX, cropY, cropW, cropH };

    // Draw overlay around crop area (4 rectangles)
    ctx.fillRect(offsetX, offsetY, displayWidth, cropY - offsetY);
    ctx.fillRect(offsetX, cropY + cropH, displayWidth, displayHeight - (cropY - offsetY + cropH));
    ctx.fillRect(offsetX, cropY, cropX - offsetX, cropH);
    ctx.fillRect(cropX + cropW, cropY, displayWidth - (cropX - offsetX + cropW), cropH);

    // Draw crop border
    const borderColor = isCustomMode ? '#00d4ff' : '#00d4ff';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Draw segment divider lines
    const gapHeightRatio = target.gap / target.totalHeight;

    let cumulativeHeightRatio = 0;
    for (let i = 0; i < segments - 1; i++) {
      cumulativeHeightRatio += target.segmentHeights[i] / target.totalHeight;

      const gapStartRatio = cumulativeHeightRatio;
      const gapEndRatio = gapStartRatio + gapHeightRatio;

      const gapStartY = cropY + gapStartRatio * cropH;
      const gapEndY = cropY + gapEndRatio * cropH;
      const gapCenterY = (gapStartY + gapEndY) / 2;

      // Draw gap area
      ctx.fillStyle = isCustomMode ? 'rgba(0, 212, 255, 0.15)' : 'rgba(0, 212, 255, 0.1)';
      ctx.fillRect(cropX + 2, gapStartY, cropW - 4, gapEndY - gapStartY);

      // Draw divider line (draggable in custom mode)
      ctx.strokeStyle = isCustomMode
        ? (hoverMode === `divider-${i}` ? '#00ffff' : 'rgba(0, 212, 255, 0.7)')
        : 'rgba(0, 212, 255, 0.5)';
      ctx.lineWidth = isCustomMode && hoverMode === `divider-${i}` ? 3 : 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cropX + 8, gapCenterY);
      ctx.lineTo(cropX + cropW - 8, gapCenterY);
      ctx.stroke();

      // Draw drag handle indicator in custom mode
      if (isCustomMode) {
        const handleWidth = 40;
        const handleHeight = 8;
        ctx.fillStyle = hoverMode === `divider-${i}` ? '#00ffff' : 'rgba(0, 212, 255, 0.8)';
        ctx.beginPath();
        ctx.roundRect(
          cropX + cropW / 2 - handleWidth / 2,
          gapCenterY - handleHeight / 2,
          handleWidth,
          handleHeight,
          4
        );
        ctx.fill();
      }

      cumulativeHeightRatio += gapHeightRatio;
    }

    ctx.setLineDash([]);

    // Draw corner/edge handles (more prominent in custom mode)
    const handleSize = isCustomMode ? 14 : 12;
    const handleColor = isCustomMode ? '#00d4ff' : '#00d4ff';
    ctx.fillStyle = handleColor;

    // Highlight active handle
    const highlightHandle = (condition: boolean) => {
      if (condition && isCustomMode) {
        ctx.fillStyle = '#00ffff';
      } else {
        ctx.fillStyle = handleColor;
      }
    };

    // Top-left corner
    highlightHandle(hoverMode === 'resize-corner-tl' || hoverMode === 'resize-left' || hoverMode === 'resize-top');
    ctx.fillRect(cropX - 2, cropY - 2, handleSize, 3);
    ctx.fillRect(cropX - 2, cropY - 2, 3, handleSize);

    // Top-right corner
    highlightHandle(hoverMode === 'resize-corner-tr' || hoverMode === 'resize-right' || hoverMode === 'resize-top');
    ctx.fillRect(cropX + cropW - handleSize + 2, cropY - 2, handleSize, 3);
    ctx.fillRect(cropX + cropW - 1, cropY - 2, 3, handleSize);

    // Bottom-left corner
    highlightHandle(hoverMode === 'resize-corner-bl' || hoverMode === 'resize-left' || hoverMode === 'resize-bottom');
    ctx.fillRect(cropX - 2, cropY + cropH - 1, handleSize, 3);
    ctx.fillRect(cropX - 2, cropY + cropH - handleSize + 2, 3, handleSize);

    // Bottom-right corner
    highlightHandle(hoverMode === 'resize-corner-br' || hoverMode === 'resize-right' || hoverMode === 'resize-bottom');
    ctx.fillRect(cropX + cropW - handleSize + 2, cropY + cropH - 1, handleSize, 3);
    ctx.fillRect(cropX + cropW - 1, cropY + cropH - handleSize + 2, 3, handleSize);

    // Draw edge handles in custom mode
    if (isCustomMode) {
      const edgeHandleLength = 24;
      const edgeHandleWidth = 4;

      // Left edge
      highlightHandle(hoverMode === 'resize-left');
      ctx.fillRect(cropX - 2, cropY + cropH / 2 - edgeHandleLength / 2, edgeHandleWidth, edgeHandleLength);

      // Right edge
      highlightHandle(hoverMode === 'resize-right');
      ctx.fillRect(cropX + cropW - 2, cropY + cropH / 2 - edgeHandleLength / 2, edgeHandleWidth, edgeHandleLength);

      // Top edge
      highlightHandle(hoverMode === 'resize-top');
      ctx.fillRect(cropX + cropW / 2 - edgeHandleLength / 2, cropY - 2, edgeHandleLength, edgeHandleWidth);

      // Bottom edge
      highlightHandle(hoverMode === 'resize-bottom');
      ctx.fillRect(cropX + cropW / 2 - edgeHandleLength / 2, cropY + cropH - 2, edgeHandleLength, edgeHandleWidth);
    }

  }, [image, crop, segments, dimensionConfig, target, isCustomMode, hoverMode]);

  // Detect which area the mouse is over
  const detectHitArea = useCallback((clientX: number, clientY: number): DragMode => {
    const container = containerRef.current;
    const info = displayInfoRef.current;
    if (!container || !info) return 'pan';

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { cropX, cropY, cropW, cropH } = info;
    const handleSize = 16;
    const edgeTolerance = 8;

    // Check corners first (highest priority)
    if (isCustomMode) {
      // Top-left corner
      if (x >= cropX - handleSize && x <= cropX + handleSize && y >= cropY - handleSize && y <= cropY + handleSize) {
        return 'resize-corner-tl';
      }
      // Top-right corner
      if (x >= cropX + cropW - handleSize && x <= cropX + cropW + handleSize && y >= cropY - handleSize && y <= cropY + handleSize) {
        return 'resize-corner-tr';
      }
      // Bottom-left corner
      if (x >= cropX - handleSize && x <= cropX + handleSize && y >= cropY + cropH - handleSize && y <= cropY + cropH + handleSize) {
        return 'resize-corner-bl';
      }
      // Bottom-right corner
      if (x >= cropX + cropW - handleSize && x <= cropX + cropW + handleSize && y >= cropY + cropH - handleSize && y <= cropY + cropH + handleSize) {
        return 'resize-corner-br';
      }

      // Check segment dividers
      const gapHeightRatio = target.gap / target.totalHeight;
      let cumulativeHeightRatio = 0;
      for (let i = 0; i < segments - 1; i++) {
        cumulativeHeightRatio += target.segmentHeights[i] / target.totalHeight;
        const gapStartRatio = cumulativeHeightRatio;
        const gapEndRatio = gapStartRatio + gapHeightRatio;
        const gapCenterY = cropY + ((gapStartRatio + gapEndRatio) / 2) * cropH;

        if (x >= cropX && x <= cropX + cropW && Math.abs(y - gapCenterY) <= 12) {
          return `divider-${i}`;
        }
        cumulativeHeightRatio += gapHeightRatio;
      }

      // Check edges (exclude corner regions)
      const cornerExclude = handleSize + 4; // Exclude corner areas from edge detection

      // Left edge (exclude top-left and bottom-left corners)
      if (x >= cropX - edgeTolerance && x <= cropX + edgeTolerance &&
          y >= cropY + cornerExclude && y <= cropY + cropH - cornerExclude) {
        return 'resize-left';
      }
      // Right edge (exclude top-right and bottom-right corners)
      if (x >= cropX + cropW - edgeTolerance && x <= cropX + cropW + edgeTolerance &&
          y >= cropY + cornerExclude && y <= cropY + cropH - cornerExclude) {
        return 'resize-right';
      }
      // Top edge (exclude top-left and top-right corners)
      if (y >= cropY - edgeTolerance && y <= cropY + edgeTolerance &&
          x >= cropX + cornerExclude && x <= cropX + cropW - cornerExclude) {
        return 'resize-top';
      }
      // Bottom edge (exclude bottom-left and bottom-right corners)
      if (y >= cropY + cropH - edgeTolerance && y <= cropY + cropH + edgeTolerance &&
          x >= cropX + cornerExclude && x <= cropX + cropW - cornerExclude) {
        return 'resize-bottom';
      }
    }

    // Default to pan if inside crop area
    if (x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH) {
      return 'pan';
    }

    return 'none';
  }, [isCustomMode, target, segments]);

  // Handle dimension changes during drag
  const handleDimensionDrag = useCallback((deltaX: number, deltaY: number, mode: DragMode) => {
    if (!isCustomMode || !onDimensionChange || !dimensionConfig.custom) return;

    const { width, segmentHeights, gap } = dimensionConfig.custom;
    const info = displayInfoRef.current;
    if (!info) return;

    // Use a fixed sensitivity factor instead of dynamic scale
    // This makes dragging feel more consistent
    const sensitivity = 2.0;
    const pixelDeltaX = deltaX * sensitivity;
    const pixelDeltaY = deltaY * sensitivity;

    let newWidth = width;
    let newHeights = [...segmentHeights];
    // Ensure heights array has correct length
    while (newHeights.length < segments) {
      newHeights.push(newHeights[newHeights.length - 1] || 253);
    }
    newHeights = newHeights.slice(0, segments);

    // Determine which dimensions to change based on mode
    const affectsWidth = mode === 'resize-left' || mode === 'resize-right' ||
      mode === 'resize-corner-tl' || mode === 'resize-corner-tr' ||
      mode === 'resize-corner-bl' || mode === 'resize-corner-br';

    const affectsHeight = mode === 'resize-top' || mode === 'resize-bottom' ||
      mode === 'resize-corner-tl' || mode === 'resize-corner-tr' ||
      mode === 'resize-corner-bl' || mode === 'resize-corner-br';

    // Handle width changes
    if (affectsWidth) {
      const isLeftSide = mode === 'resize-left' || mode === 'resize-corner-tl' || mode === 'resize-corner-bl';
      const widthDelta = isLeftSide ? -pixelDeltaX : pixelDeltaX;
      newWidth = Math.max(100, Math.min(2000, width + widthDelta));
    }

    // Handle height changes (uniform across all segments)
    if (affectsHeight) {
      const isTopSide = mode === 'resize-top' || mode === 'resize-corner-tl' || mode === 'resize-corner-tr';
      const totalHeightDelta = isTopSide ? -pixelDeltaY : pixelDeltaY;
      const perSegmentDelta = totalHeightDelta / segments;
      newHeights = newHeights.map(h => Math.max(50, Math.min(1000, h + perSegmentDelta)));
    }

    // Handle divider drag (redistribute heights between adjacent segments)
    if (mode.startsWith('divider-')) {
      const dividerIndex = parseInt(mode.split('-')[1]);
      const topIdx = dividerIndex;
      const bottomIdx = dividerIndex + 1;

      if (topIdx < newHeights.length && bottomIdx < newHeights.length) {
        const heightDelta = pixelDeltaY * sensitivity;
        const newTopHeight = newHeights[topIdx] + heightDelta;
        const newBottomHeight = newHeights[bottomIdx] - heightDelta;

        if (newTopHeight >= 50 && newTopHeight <= 1000 && newBottomHeight >= 50 && newBottomHeight <= 1000) {
          newHeights[topIdx] = newTopHeight;
          newHeights[bottomIdx] = newBottomHeight;
        }
      }
    }

    onDimensionChange(Math.round(newWidth), newHeights.map(h => Math.round(h)), gap);
  }, [isCustomMode, onDimensionChange, dimensionConfig, segments]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const mode = detectHitArea(e.clientX, e.clientY);
    if (mode === 'none') return;

    setDragMode(mode);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, [detectHitArea]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Update hover state
    if (dragMode === 'none') {
      const mode = detectHitArea(e.clientX, e.clientY);
      setHoverMode(mode);
    }

    if (dragMode === 'none' || !lastPosRef.current) return;

    const info = displayInfoRef.current;
    if (!info) return;

    const deltaX = e.clientX - lastPosRef.current.x;
    const deltaY = e.clientY - lastPosRef.current.y;

    if (dragMode === 'pan') {
      // Convert mouse delta to normalized coordinates
      const normDeltaX = deltaX / info.displayWidth;
      const normDeltaY = deltaY / info.displayHeight;
      onPan(normDeltaX, normDeltaY);
    } else {
      // Handle dimension resize
      handleDimensionDrag(deltaX, deltaY, dragMode);
    }

    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, [dragMode, detectHitArea, onPan, handleDimensionDrag]);

  const handleMouseUp = useCallback(() => {
    setDragMode('none');
    lastPosRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (dragMode !== 'none') {
      setDragMode('none');
      lastPosRef.current = null;
    }
    setHoverMode('none');
  }, [dragMode]);

  // Wheel event for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    onZoomDelta(delta);
  }, [onZoomDelta]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const mode = detectHitArea(e.touches[0].clientX, e.touches[0].clientY);
      setDragMode(mode === 'none' ? 'pan' : mode);
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [detectHitArea]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragMode === 'none' || !lastPosRef.current || e.touches.length !== 1) return;

    const info = displayInfoRef.current;
    if (!info) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastPosRef.current.x;
    const deltaY = touch.clientY - lastPosRef.current.y;

    if (dragMode === 'pan') {
      const normDeltaX = deltaX / info.displayWidth;
      const normDeltaY = deltaY / info.displayHeight;
      onPan(normDeltaX, normDeltaY);
    } else {
      handleDimensionDrag(deltaX, deltaY, dragMode);
    }

    lastPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, [dragMode, onPan, handleDimensionDrag]);

  const handleTouchEnd = useCallback(() => {
    setDragMode('none');
    lastPosRef.current = null;
  }, []);

  const currentCursor = dragMode !== 'none' ? getCursor(dragMode) : getCursor(hoverMode);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      style={{ cursor: currentCursor }}
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
        {isCustomMode
          ? 'Drag edges to resize • Drag dividers to adjust • Scroll to zoom'
          : 'Drag to pan • Scroll to zoom'
        }
      </div>
    </div>
  );
}
