'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ControlPanel from '@/components/ControlPanel';
import SplitPreview from '@/components/SplitPreview';

export default function Home() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [segments, setSegments] = useState<2 | 3 | 4>(4);

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          X-Split
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Split long images for seamless display on Twitter/X
        </p>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column - Upload & Configure */}
        <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
          {/* Upload Section */}
          <section className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              1. Upload Image
            </h2>
            <ImageUploader onImageLoad={setImage} />
          </section>

          {/* Configure Section */}
          <section className="p-4">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              2. Configure Split
            </h2>
            <ControlPanel
              segments={segments}
              onSegmentsChange={setSegments}
              imageWidth={image?.naturalWidth}
              imageHeight={image?.naturalHeight}
              disabled={!image}
            />
          </section>
        </div>

        {/* Right Column - Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          <section className="flex-1 flex flex-col p-4 overflow-hidden">
            <h2 className="flex-shrink-0 text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              3. Preview & Download
            </h2>
            <div className="flex-1 overflow-y-auto">
              <SplitPreview image={image} segments={segments} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
