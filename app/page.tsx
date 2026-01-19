'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ControlPanel from '@/components/ControlPanel';
import SplitPreview from '@/components/SplitPreview';
import type { DisplayMode } from '@/lib/splitImage';

export default function Home() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [segments, setSegments] = useState<2 | 3 | 4>(4);
  const [mode, setMode] = useState<DisplayMode>('mobile');

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div
          className="w-80 flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)'
          }}
        >
          {/* Upload Section */}
          <section className="p-5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)'
                }}
              >
                1
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Upload Image
              </span>
            </div>
            <ImageUploader onImageLoad={setImage} />
          </section>

          {/* Configure Section */}
          <section className="p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)'
                }}
              >
                2
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Configure
              </span>
            </div>
            <ControlPanel
              segments={segments}
              mode={mode}
              onSegmentsChange={setSegments}
              onModeChange={setMode}
              imageWidth={image?.naturalWidth}
              imageHeight={image?.naturalHeight}
              disabled={!image}
            />
          </section>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col overflow-hidden preview-container">
          <section className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-semibold"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)'
                }}
              >
                3
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Preview & Export
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SplitPreview image={image} segments={segments} mode={mode} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
