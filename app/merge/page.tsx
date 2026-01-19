'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import MergeUploader, { type ImageItem } from '@/components/MergeUploader';
import MergePreview from '@/components/MergePreview';

export default function MergePage() {
  const [images, setImages] = useState<ImageItem[]>([]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Upload */}
        <div
          className="w-80 flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border)',
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
            <MergeUploader images={images} onImagesChange={setImages} maxImages={4} />
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
        <div className="flex-1 flex flex-col overflow-hidden preview-container">
          <section className="flex-1 flex flex-col p-6 overflow-hidden">
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
              <MergePreview images={images} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
