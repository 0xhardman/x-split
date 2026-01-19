'use client';

import { useEffect, useState, useRef } from 'react';
import { mergeImages, MERGE_OUTPUT_WIDTH, type MergeResult, type GapFillType } from '@/lib/mergeImage';
import type { ImageItem } from './MergeUploader';

interface MergePreviewProps {
  images: ImageItem[];
  gapFillType: GapFillType;
  gapSize: number;
  solidColor: string;
}

export default function MergePreview({ images, gapFillType, gapSize, solidColor }: MergePreviewProps) {
  const [result, setResult] = useState<MergeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Process images when they change (debounced)
  useEffect(() => {
    if (images.length === 0) {
      setResult(null);
      return;
    }

    // Clear previous timer
    if (processTimerRef.current) {
      clearTimeout(processTimerRef.current);
    }

    // Debounce processing
    processTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const mergeResult = await mergeImages({
          images: images.map((item) => item.image),
          gapFillType,
          gapSize,
          solidColor,
        });
        setResult(mergeResult);
      } catch (error) {
        console.error('Failed to merge images:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 100);

    return () => {
      if (processTimerRef.current) {
        clearTimeout(processTimerRef.current);
      }
    };
  }, [images, gapFillType, gapSize, solidColor]);

  const handleDownload = () => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = 'merged-image.png';
    link.click();
  };

  // Empty state
  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs">
          {/* Decorative empty state */}
          <div className="relative mx-auto w-24 h-32 mb-6">
            {/* Stacked images representing merge */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-16 h-10 rounded"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  top: `${i * 10}px`,
                  opacity: 1 - i * 0.2,
                  transform: `translateX(-50%) scale(${1 - i * 0.05})`,
                }}
              />
            ))}
            {/* Arrow down */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              style={{ color: 'var(--accent)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload 2-4 images to merge them into one
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
            Merging...
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  // Calculate preview scale (max 400px wide or full width if smaller)
  const previewScale = Math.min(1, 400 / result.width);
  const previewHeight = result.height * previewScale;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Merged Preview
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {result.width} × {result.height}
        </span>
      </div>

      {/* Preview Area */}
      <div
        className="flex-1 rounded-xl overflow-auto flex items-start justify-center p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="preview-image" style={{ opacity: 0 }}>
          <img
            src={result.dataUrl}
            alt="Merged image preview"
            className="rounded-lg shadow-lg"
            style={{
              width: result.width * previewScale,
              height: previewHeight,
              maxHeight: '60vh',
              objectFit: 'contain',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        className="flex items-center justify-between text-xs font-mono px-3 py-2 rounded-lg"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-muted)',
        }}
      >
        <span>{images.length} images</span>
        <span style={{ color: 'var(--accent)' }}>→</span>
        <span>{MERGE_OUTPUT_WIDTH} × {result.height}</span>
      </div>

      {/* Download Button */}
      <div
        className="flex-shrink-0 rounded-xl p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <button
          onClick={handleDownload}
          className="w-full btn-download flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Merged Image
        </button>
      </div>
    </div>
  );
}
