'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import MergeUploader, { type ImageItem, loadImageFromUrl } from '@/components/MergeUploader';
import MergePreview from '@/components/MergePreview';
import TwitterUrlInput from '@/components/TwitterUrlInput';
import { type GapFillType } from '@/lib/mergeImage';

export default function MergePage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [gapFillType, setGapFillType] = useState<GapFillType>('none');
  const [gapSize, setGapSize] = useState(16);
  const [solidColor, setSolidColor] = useState('#000000');
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);

  const handleTwitterImagesLoaded = useCallback(async (urls: string[]) => {
    const maxImages = 4;
    const remainingSlots = maxImages - images.length;
    const urlsToLoad = urls.slice(0, remainingSlots);

    if (urlsToLoad.length === 0) return;

    setIsLoadingFromUrl(true);
    try {
      // Try direct fetch first (Twitter allows CORS), fallback to proxy if needed
      const loadedImages = await Promise.all(
        urlsToLoad.map(async (url, index) => {
          try {
            return await loadImageFromUrl(url, index);
          } catch {
            // Fallback to proxy if direct fetch fails
            const proxyUrl = `/api/twitter/image?url=${encodeURIComponent(url)}`;
            return await loadImageFromUrl(proxyUrl, index);
          }
        })
      );
      setImages((prev) => [...prev, ...loadedImages]);
    } catch (error) {
      console.error('Error loading images from URL:', error);
    } finally {
      setIsLoadingFromUrl(false);
    }
  }, [images.length]);

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        {/* Left Panel - Upload */}
        <div
          className="w-full md:w-80 flex-shrink-0 flex flex-col md:overflow-y-auto border-b md:border-b-0 md:border-r"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Upload Section */}
          <section className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                1
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Upload Images
              </span>
            </div>

            {/* Twitter URL Import */}
            {images.length < 4 && (
              <div className="mb-4">
                <TwitterUrlInput
                  onImagesLoaded={handleTwitterImagesLoaded}
                  disabled={isLoadingFromUrl}
                />
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>
              </div>
            )}

            <MergeUploader images={images} onImagesChange={setImages} maxImages={4} />
          </section>

          {/* Gap Fill Options */}
          <section className="p-5 border-t" style={{ borderColor: 'var(--border)' }}>
            {/* Fill Type Selector */}
            <div className="mb-4">
              <label
                className="block text-xs font-medium mb-3 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Gap Fill
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { type: 'none' as const, label: 'None' },
                  { type: 'blur' as const, label: 'Blur' },
                  { type: 'solid' as const, label: 'Solid' },
                ]).map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setGapFillType(type)}
                    className={`
                      py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 cursor-pointer
                      ${gapFillType === type ? 'segment-btn-active text-white' : ''}
                    `}
                    style={gapFillType !== type ? {
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gap Size Input (only visible when fill type is not none) */}
            {gapFillType !== 'none' && (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-2 uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Gap Size (px)
                  </label>
                  <input
                    type="number"
                    value={gapSize}
                    onChange={(e) => setGapSize(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    max={200}
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    {[16, 57].map((size) => (
                      <button
                        key={size}
                        onClick={() => setGapSize(size)}
                        className="px-2 py-1 rounded text-xs font-mono transition-colors"
                        style={{
                          background: gapSize === size ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                          color: gapSize === size ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker (only for solid fill) */}
                {gapFillType === 'solid' && (
                  <div>
                    <label
                      className="block text-xs font-medium mb-2 uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Fill Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={solidColor}
                        onChange={(e) => setSolidColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                        }}
                      />
                      <input
                        type="text"
                        value={solidColor}
                        onChange={(e) => setSolidColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Info Panel */}
          <section className="p-5 mt-auto">
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--accent)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  How it works
                </span>
              </div>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>Upload 2-4 images</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>Drag to reorder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>Images scaled to 556px width</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>Merged vertically top to bottom</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col md:overflow-hidden preview-container md:min-h-0">
          <section className="flex-1 flex flex-col p-4 md:p-6 md:overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                2
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Preview & Export
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MergePreview images={images} gapFillType={gapFillType} gapSize={gapSize} solidColor={solidColor} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
