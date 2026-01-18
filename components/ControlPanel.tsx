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
    <div className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Number of segments
        </label>
        <div className="flex gap-2">
          {([2, 3, 4] as const).map((num) => (
            <button
              key={num}
              onClick={() => onSegmentsChange(num)}
              disabled={disabled}
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                ${segments === num
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm space-y-2">
        <h4 className="font-medium text-zinc-700 dark:text-zinc-300">Twitter Display Parameters</h4>
        <div className="text-zinc-600 dark:text-zinc-400 space-y-1">
          <p>Target ratio: {target.width} : {target.totalHeight} (with gap space)</p>
          <p>Each output: {target.width} x {target.segmentHeight}px</p>
          <p>Gap between images: {TWITTER_DISPLAY.gap}px × {target.gapCount} = {TWITTER_DISPLAY.gap * target.gapCount}px (removed)</p>
          {imageWidth && imageHeight && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-700 my-2" />
              <p>Your image: {imageWidth} x {imageHeight}px</p>
              <p>Your ratio: {(imageWidth / imageHeight).toFixed(4)}</p>
              <p>Target ratio: {target.aspectRatio.toFixed(4)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
