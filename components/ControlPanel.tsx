'use client';

import { getTargetDimensions, TWITTER_DISPLAY } from '@/lib/splitImage';

interface ControlPanelProps {
  segments: 2 | 3 | 4;
  onSegmentsChange: (segments: 2 | 3 | 4) => void;
  imageWidth?: number;
  imageHeight?: number;
  disabled?: boolean;
}

export default function ControlPanel({
  segments,
  onSegmentsChange,
  imageWidth,
  imageHeight,
  disabled = false,
}: ControlPanelProps) {
  const target = getTargetDimensions(segments);

  return (
    <div className="w-full space-y-5">
      {/* Segment Selector */}
      <div>
        <label
          className="block text-xs font-medium mb-3 uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Split into
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((num) => (
            <button
              key={num}
              onClick={() => onSegmentsChange(num)}
              disabled={disabled}
              className={`
                relative py-3 rounded-lg font-display font-semibold text-lg
                transition-all duration-200
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${segments === num ? 'segment-btn-active text-white' : ''}
              `}
              style={segments !== num ? {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              } : undefined}
            >
              {num}
              {/* Visual representation of splits */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                {[...Array(num)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: segments === num ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                      opacity: segments === num ? 1 : 0.4
                    }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Panel */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)'
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
            Output Parameters
          </span>
        </div>

        <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex justify-between">
            <span>Target ratio</span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
              {target.width}:{target.totalHeight}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Each segment</span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
              {target.width} × {target.segmentHeight}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gap removed</span>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>
              {TWITTER_DISPLAY.gap}px × {target.gapCount}
            </span>
          </div>
        </div>

        {imageWidth && imageHeight && (
          <>
            <div
              className="h-px my-3"
              style={{ background: 'var(--border)' }}
            />
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Your image</span>
                <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {imageWidth} × {imageHeight}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Aspect ratio</span>
                <span
                  className="font-mono"
                  style={{
                    color: Math.abs((imageWidth / imageHeight) - target.aspectRatio) < 0.1
                      ? 'var(--accent)'
                      : 'var(--text-secondary)'
                  }}
                >
                  {(imageWidth / imageHeight).toFixed(3)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
