'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ControlPanel from '@/components/ControlPanel';
import SplitPreview from '@/components/SplitPreview';

export default function Home() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [segments, setSegments] = useState<2 | 3 | 4>(4);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <header
        className="flex-shrink-0 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #0088aa 100%)',
                opacity: 0.15
              }}
            />
            <span className="font-display font-bold text-xl text-accent relative">X</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
              X-Split
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Seamless Twitter image splitting
            </p>
          </div>
        </div>

        {/* Decorative split lines */}
        <div className="hidden sm:flex items-center gap-1 opacity-40">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-0.5 h-6 rounded-full split-line"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </header>

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
              onSegmentsChange={setSegments}
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
              <SplitPreview image={image} segments={segments} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
