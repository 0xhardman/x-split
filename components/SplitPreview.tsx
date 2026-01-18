'use client';

import { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import { splitImage, getPreviewInfo, getDisplayConfig, type SplitResult, type DisplayMode } from '@/lib/splitImage';

interface SplitPreviewProps {
  image: HTMLImageElement | null;
  segments: 2 | 3 | 4;
  mode: DisplayMode;
}

export default function SplitPreview({ image, segments, mode }: SplitPreviewProps) {
  const [result, setResult] = useState<SplitResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const config = getDisplayConfig(mode);

  const previewInfo = useMemo(() => {
    if (!image) return null;
    return getPreviewInfo(image.naturalWidth, image.naturalHeight, segments, mode);
  }, [image, segments, mode]);

  useEffect(() => {
    if (!image) {
      setResult(null);
      return;
    }

    const process = async () => {
      setIsProcessing(true);
      try {
        const splitResult = await splitImage({ image, segments, mode });
        setResult(splitResult);
      } catch (error) {
        console.error('Failed to split image:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    process();
  }, [image, segments, mode]);

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

  // Loading state
  if (isProcessing) {
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

  const previewScale = Math.min(1, 420 / config.width);

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Crop Warning */}
      {previewInfo && (previewInfo.willCropWidth || previewInfo.willCropHeight) && (
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

      {/* Preview Area */}
      <div className="flex-1 flex items-start justify-center overflow-auto py-2">
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Preview header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {mode === 'mobile' ? 'Mobile' : 'Desktop'} Preview
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {config.gap}px gaps
            </span>
          </div>

          {/* Split images with animated entry */}
          <div
            className="flex flex-col rounded-lg overflow-hidden"
            style={{
              gap: `${config.gap * previewScale}px`,
              background: 'var(--bg-primary)'
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
                    width: config.width * previewScale,
                    height: config.segmentHeight * previewScale,
                  }}
                />
                {/* Segment number overlay */}
                <div
                  className="absolute top-2 left-2 w-6 h-6 rounded flex items-center justify-center
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
      </div>

      {/* Download Actions */}
      <div
        className="flex-shrink-0 rounded-xl p-4"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Individual downloads */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Download:
            </span>
            {result.dataUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDownloadSingle(index)}
                className="w-8 h-8 rounded-lg flex items-center justify-center
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
            className="btn-download flex items-center gap-2 px-5 py-2.5 rounded-lg
              text-sm font-medium text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download ZIP
          </button>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center justify-between mt-3 pt-3 text-xs font-mono"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)'
          }}
        >
          <span>{image.naturalWidth} × {image.naturalHeight}</span>
          <span style={{ color: 'var(--accent)' }}>→</span>
          <span>{result.segmentWidth} × {result.segmentHeight} × {segments}</span>
        </div>
      </div>
    </div>
  );
}
