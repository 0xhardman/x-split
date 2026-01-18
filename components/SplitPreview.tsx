'use client';

import { useEffect, useState, useMemo } from 'react';
import JSZip from 'jszip';
import { splitImage, getPreviewInfo, TWITTER_DISPLAY, type SplitResult } from '@/lib/splitImage';

interface SplitPreviewProps {
  image: HTMLImageElement | null;
  segments: 2 | 3 | 4;
}

export default function SplitPreview({ image, segments }: SplitPreviewProps) {
  const [result, setResult] = useState<SplitResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const previewInfo = useMemo(() => {
    if (!image) return null;
    return getPreviewInfo(image.naturalWidth, image.naturalHeight, segments);
  }, [image, segments]);

  useEffect(() => {
    if (!image) {
      setResult(null);
      return;
    }

    const process = async () => {
      setIsProcessing(true);
      try {
        const splitResult = await splitImage({ image, segments });
        setResult(splitResult);
      } catch (error) {
        console.error('Failed to split image:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    process();
  }, [image, segments]);

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

  if (!image) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Upload an image to see preview</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Processing...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Calculate preview scale to fit in viewport
  const previewScale = Math.min(1, 400 / TWITTER_DISPLAY.width);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Crop info */}
      {previewInfo && (previewInfo.willCropWidth || previewInfo.willCropHeight) && (
        <div className="flex-shrink-0 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
          {previewInfo.willCropWidth && <span>Width cropped to fit</span>}
          {previewInfo.willCropHeight && <span>Height cropped to fit</span>}
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 overflow-auto">
        <div className="inline-flex flex-col bg-white dark:bg-zinc-800 rounded-lg p-3 shadow-sm">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Twitter preview ({TWITTER_DISPLAY.gap}px gaps)
          </p>
          <div
            className="flex flex-col"
            style={{ gap: `${TWITTER_DISPLAY.gap * previewScale}px` }}
          >
            {result.dataUrls.map((dataUrl, index) => (
              <img
                key={index}
                src={dataUrl}
                alt={`Segment ${index + 1}`}
                className="rounded shadow-sm"
                style={{
                  width: TWITTER_DISPLAY.width * previewScale,
                  height: TWITTER_DISPLAY.segmentHeight * previewScale,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Download & Info */}
      <div className="flex-shrink-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          {result.dataUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDownloadSingle(index)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded
                text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700
                transition-colors text-sm border border-zinc-200 dark:border-zinc-700"
            >
              #{index + 1}
            </button>
          ))}
          <button
            onClick={handleDownloadAll}
            className="px-3 py-1.5 bg-blue-500 text-white rounded
              hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Download ZIP
          </button>
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          <span>Original: {image.naturalWidth}×{image.naturalHeight}</span>
          <span className="mx-2">→</span>
          <span>Output: {result.segmentWidth}×{result.segmentHeight} × {segments}</span>
        </div>
      </div>
    </div>
  );
}
