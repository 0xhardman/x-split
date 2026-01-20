'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { splitImageV2, getPreviewInfoV2, getTargetDimensionsV2, type SplitResultV2, type DimensionConfig } from '@/lib/splitImage';
import { useCropControls, type CropState } from '@/hooks/useCropControls';
import CropOverlay from './CropOverlay';
import CropControls from './CropControls';

interface SplitPreviewProps {
  image: HTMLImageElement | null;
  segments: 2 | 3 | 4;
  dimensionConfig: DimensionConfig;
  onDimensionConfigChange?: (config: DimensionConfig) => void;
}

export default function SplitPreview({ image, segments, dimensionConfig, onDimensionConfigChange }: SplitPreviewProps) {
  const [result, setResult] = useState<SplitResultV2 | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const target = getTargetDimensionsV2(segments, dimensionConfig);

  // Handle dimension changes from CropOverlay drag
  const handleDimensionChange = useCallback((width: number, segmentHeights: number[], gap: number) => {
    if (!onDimensionConfigChange || dimensionConfig.preset !== 'custom') return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: { width, segmentHeights, gap },
    });
  }, [onDimensionConfigChange, dimensionConfig]);

  // Calculate preview scale to fit container
  const updatePreviewScale = useCallback(() => {
    if (!previewContainerRef.current || !result) return;

    const container = previewContainerRef.current;
    const padding = 32; // p-4 = 16px * 2
    const availableWidth = container.clientWidth - padding;
    const availableHeight = container.clientHeight - padding;

    // Calculate total preview dimensions
    const previewWidth = result.segmentWidth;
    const totalGapHeight = target.gap * (segments - 1);
    const previewHeight = result.segmentHeights.reduce((sum, h) => sum + h, 0) + totalGapHeight;

    // Calculate scale to fit both dimensions
    const scaleX = availableWidth / previewWidth;
    const scaleY = availableHeight / previewHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

    setPreviewScale(scale);
  }, [result, target.gap, segments]);

  // Update scale on result change and window resize
  useEffect(() => {
    updatePreviewScale();

    const handleResize = () => updatePreviewScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePreviewScale]);

  // Crop controls hook
  const cropControls = useCropControls({ image, segments, dimensionConfig });

  const previewInfo = useMemo(() => {
    if (!image) return null;
    return getPreviewInfoV2(image.naturalWidth, image.naturalHeight, segments, dimensionConfig);
  }, [image, segments, dimensionConfig]);

  // Debounce timer ref
  const processTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Process image when crop changes (debounced)
  useEffect(() => {
    if (!image || !cropControls.crop) {
      setResult(null);
      return;
    }

    // Clear previous timer
    if (processTimerRef.current) {
      clearTimeout(processTimerRef.current);
    }

    // Debounce the processing to avoid flickering during drag/zoom
    processTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const splitResult = await splitImageV2({
          image,
          segments,
          dimensionConfig,
          customCrop: cropControls.crop as CropState,
        });
        setResult(splitResult);
      } catch (error) {
        console.error('Failed to split image:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 50);

    return () => {
      if (processTimerRef.current) {
        clearTimeout(processTimerRef.current);
      }
    };
  }, [image, segments, dimensionConfig, cropControls.crop]);

  const handleDownloadSingle = (index: number) => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result.dataUrls[index];
    link.download = `split-${index + 1}.png`;
    link.click();
  };

  const handleDownloadAll = async () => {
    if (!result) return;

    const zip = new JSZip();

    result.blobs.forEach((blob, index) => {
      zip.file(`split-${index + 1}.png`, blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'x-split-images.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Empty state
  if (!image) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs">
          {/* Decorative empty state */}
          <div className="relative mx-auto w-24 h-32 mb-6">
            {/* Stacked rectangles representing split images */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-16 h-8 rounded"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  top: `${i * 12}px`,
                  opacity: 1 - i * 0.2,
                  transform: `translateX(-50%) scale(${1 - i * 0.05})`,
                }}
              />
            ))}
            {/* Split lines */}
            <div
              className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2 split-line opacity-30"
            />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload an image to preview your splits
          </p>
        </div>
      </div>
    );
  }

  // Loading state (only show if no result yet)
  if (isProcessing && !result) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full spinner mx-auto" />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Processing...
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Crop Warning */}
      {previewInfo && (previewInfo.willCropWidth || previewInfo.willCropHeight) && !cropControls.isModified && (
        <div
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            background: 'rgba(255, 180, 0, 0.1)',
            border: '1px solid rgba(255, 180, 0, 0.2)',
            color: '#ffb400'
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            {previewInfo.willCropWidth ? 'Width' : 'Height'} will be cropped to fit ratio
          </span>
        </div>
      )}

      {/* Main content - two columns (stack on mobile) */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:min-h-0">
        {/* Left Column - Crop Editor */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-[300px] md:min-h-0">
          {/* Crop Editor Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Adjust Crop
              </span>
            </div>
            {cropControls.isModified && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                Modified
              </span>
            )}
          </div>

          {/* Crop Overlay */}
          {cropControls.crop && (
            <div
              className="flex-1 rounded-xl overflow-hidden min-h-0"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <CropOverlay
                image={image}
                crop={cropControls.crop}
                segments={segments}
                dimensionConfig={dimensionConfig}
                onPan={cropControls.handlePan}
                onZoomDelta={cropControls.handleZoomDelta}
                onDimensionChange={handleDimensionChange}
              />
            </div>
          )}

          {/* Crop Controls */}
          <CropControls
            zoom={cropControls.zoom}
            minZoom={cropControls.minZoom}
            maxZoom={cropControls.maxZoom}
            canZoomIn={cropControls.canZoomIn}
            canZoomOut={cropControls.canZoomOut}
            isModified={cropControls.isModified}
            onZoomChange={cropControls.handleZoom}
            onReset={cropControls.resetCrop}
          />
        </div>

        {/* Right Column - Preview */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-[300px] md:min-h-0">
          {/* Preview Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {dimensionConfig.preset === 'twitter'
                  ? `${dimensionConfig.mode === 'mobile' ? 'Mobile' : 'Desktop'} Preview`
                  : 'Custom Preview'}
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {target.gap}px gaps
            </span>
          </div>

          {/* Preview Area */}
          <div
            ref={previewContainerRef}
            className="flex-1 rounded-xl overflow-hidden flex items-center justify-center p-4"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            <div
              className="flex flex-col rounded-lg overflow-hidden"
              style={{
                gap: `${target.gap * previewScale}px`,
                background: 'var(--bg-primary)',
              }}
            >
              {result.dataUrls.map((dataUrl, index) => (
                <div
                  key={index}
                  className="preview-image relative group"
                  style={{ opacity: 0 }}
                >
                  <img
                    src={dataUrl}
                    alt={`Segment ${index + 1}`}
                    className="block"
                    style={{
                      width: result.segmentWidth * previewScale,
                      height: result.segmentHeights[index] * previewScale,
                    }}
                  />
                  {/* Segment number overlay */}
                  <div
                    className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center
                      text-xs font-display font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'var(--accent)'
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)'
            }}
          >
            <span>{image.naturalWidth} × {image.naturalHeight}</span>
            <span style={{ color: 'var(--accent)' }}>→</span>
            <span>
              {result.segmentWidth} × {
                // Show single height if uniform, or range if variable
                new Set(result.segmentHeights).size === 1
                  ? result.segmentHeights[0]
                  : `${Math.min(...result.segmentHeights)}–${Math.max(...result.segmentHeights)}`
              } × {segments}
            </span>
          </div>
        </div>
      </div>

      {/* Download Actions */}
      <div
        className="flex-shrink-0 rounded-xl p-3 md:p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Individual downloads */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="hidden md:inline text-xs" style={{ color: 'var(--text-muted)' }}>
              Download:
            </span>
            {result.dataUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDownloadSingle(index)}
                className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center
                  text-xs font-display font-semibold transition-all duration-200
                  hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Download all button */}
          <button
            onClick={handleDownloadAll}
            className="btn-download flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg
              text-xs md:text-sm font-medium text-white"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span> ZIP
          </button>
        </div>
      </div>
    </div>
  );
}
