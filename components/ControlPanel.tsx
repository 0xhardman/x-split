'use client';

import { useState } from 'react';
import { getTargetDimensionsV2, getDisplayConfig, type DisplayMode, type DimensionConfig, type PresetType, TWITTER_DISPLAY } from '@/lib/splitImage';

interface ControlPanelProps {
  segments: 2 | 3 | 4;
  mode: DisplayMode;
  dimensionConfig: DimensionConfig;
  onSegmentsChange: (segments: 2 | 3 | 4) => void;
  onModeChange: (mode: DisplayMode) => void;
  onDimensionConfigChange: (config: DimensionConfig) => void;
  imageWidth?: number;
  imageHeight?: number;
  disabled?: boolean;
}

export default function ControlPanel({
  segments,
  mode,
  dimensionConfig,
  onSegmentsChange,
  onModeChange,
  onDimensionConfigChange,
  imageWidth,
  imageHeight,
  disabled = false,
}: ControlPanelProps) {
  const [heightsLocked, setHeightsLocked] = useState(true);

  const target = getTargetDimensionsV2(segments, dimensionConfig);

  // Handle preset change
  const handlePresetChange = (preset: PresetType) => {
    if (preset === 'twitter') {
      onDimensionConfigChange({
        preset: 'twitter',
        mode,
      });
    } else {
      // Initialize custom with current Twitter values
      const twitterConfig = getDisplayConfig(mode);
      onDimensionConfigChange({
        preset: 'custom',
        mode,
        custom: {
          width: twitterConfig.width,
          segmentHeights: Array(segments).fill(twitterConfig.segmentHeight),
          gap: twitterConfig.gap,
        },
      });
    }
  };

  // Handle custom width change
  const handleWidthChange = (width: number) => {
    if (dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: { ...dimensionConfig.custom, width },
    });
  };

  // Handle custom gap change
  const handleGapChange = (gap: number) => {
    if (dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: { ...dimensionConfig.custom, gap },
    });
  };

  // Handle uniform height change (when locked)
  const handleUniformHeightChange = (height: number) => {
    if (dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: {
        ...dimensionConfig.custom,
        segmentHeights: Array(segments).fill(height),
      },
    });
  };

  // Handle individual segment height change (when unlocked)
  const handleSegmentHeightChange = (index: number, height: number) => {
    if (dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    const newHeights = [...dimensionConfig.custom.segmentHeights];
    // Ensure array is correct length
    while (newHeights.length < segments) {
      newHeights.push(newHeights[newHeights.length - 1] || 253);
    }
    newHeights[index] = height;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: { ...dimensionConfig.custom, segmentHeights: newHeights.slice(0, segments) },
    });
  };

  // Toggle heights lock
  const handleToggleHeightsLock = () => {
    if (heightsLocked && dimensionConfig.preset === 'custom' && dimensionConfig.custom) {
      // When unlocking, ensure we have the right number of heights
      const currentHeights = dimensionConfig.custom.segmentHeights;
      if (currentHeights.length !== segments) {
        const uniformHeight = currentHeights[0] || 253;
        onDimensionConfigChange({
          ...dimensionConfig,
          custom: {
            ...dimensionConfig.custom,
            segmentHeights: Array(segments).fill(uniformHeight),
          },
        });
      }
    }
    setHeightsLocked(!heightsLocked);
  };

  // Get the current uniform height (for locked mode)
  const getUniformHeight = (): number => {
    if (dimensionConfig.preset === 'custom' && dimensionConfig.custom) {
      return dimensionConfig.custom.segmentHeights[0] || 253;
    }
    return TWITTER_DISPLAY[mode].segmentHeight;
  };

  // Apply original width from image
  const handleApplyOriginalWidth = () => {
    if (!imageWidth || dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: { ...dimensionConfig.custom, width: imageWidth },
    });
  };

  // Calculate height for original aspect ratio crop (no content loss)
  const calculateOriginalRatioHeight = (): number | null => {
    if (!imageWidth || !imageHeight) return null;
    const currentWidth = dimensionConfig.preset === 'custom' && dimensionConfig.custom
      ? dimensionConfig.custom.width
      : TWITTER_DISPLAY[mode].width;
    const currentGap = dimensionConfig.preset === 'custom' && dimensionConfig.custom
      ? dimensionConfig.custom.gap
      : TWITTER_DISPLAY[mode].gap;

    // Calculate total height needed to match original aspect ratio
    // totalHeight = currentWidth / (imageWidth / imageHeight)
    const targetTotalHeight = currentWidth * imageHeight / imageWidth;
    // contentHeight = totalHeight - (gaps)
    const gapCount = segments - 1;
    const contentHeight = targetTotalHeight - (currentGap * gapCount);
    // segmentHeight = contentHeight / segments
    const segmentHeight = Math.round(contentHeight / segments);
    return Math.max(50, Math.min(1000, segmentHeight));
  };

  // Apply original aspect ratio (calculate segment height to match)
  const handleApplyOriginalRatio = () => {
    if (dimensionConfig.preset !== 'custom' || !dimensionConfig.custom) return;
    const segmentHeight = calculateOriginalRatioHeight();
    if (segmentHeight === null) return;
    onDimensionConfigChange({
      ...dimensionConfig,
      custom: {
        ...dimensionConfig.custom,
        segmentHeights: Array(segments).fill(segmentHeight),
      },
    });
  };

  return (
    <div className="w-full space-y-5">
      {/* Preset Toggle */}
      <div>
        <label
          className="block text-xs font-medium mb-3 uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['twitter', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              disabled={disabled}
              className={`
                py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                ${dimensionConfig.preset === p ? 'segment-btn-active text-white' : ''}
              `}
              style={dimensionConfig.preset !== p ? {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              } : undefined}
            >
              <div className="flex items-center justify-center gap-2">
                {p === 'twitter' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                <span className="capitalize">{p}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Selector (Twitter preset) or Custom Dimensions */}
      {dimensionConfig.preset === 'twitter' ? (
        <div>
          <label
            className="block text-xs font-medium mb-3 uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Platform
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['mobile', 'desktop'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                disabled={disabled}
                className={`
                  relative py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${mode === m ? 'segment-btn-active text-white' : ''}
                `}
                style={mode !== m ? {
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                } : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  {m === 'mobile' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="capitalize">{m}</span>
                </div>
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono"
                  style={{ color: mode === m ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}
                >
                  {getDisplayConfig(m).gap}px gap
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Custom Dimensions */
        <div className="space-y-4">
          <label
            className="block text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Custom Dimensions
          </label>

          {/* Original Image Info & Quick Actions */}
          {imageWidth && imageHeight && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Original</span>
                <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {imageWidth} × {imageHeight}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyOriginalWidth}
                  disabled={disabled}
                  className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                  title="Use original image width"
                >
                  Use Width
                </button>
                <button
                  onClick={handleApplyOriginalRatio}
                  disabled={disabled}
                  className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                  title="Adjust height to match original aspect ratio (no crop)"
                >
                  Fit Ratio
                </button>
              </div>
            </div>
          )}

          {/* Width Input */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Width (px)
            </label>
            <input
              type="number"
              min={100}
              max={2000}
              value={dimensionConfig.custom?.width || 556}
              onChange={(e) => handleWidthChange(Math.max(100, Math.min(2000, parseInt(e.target.value) || 556)))}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Gap Input */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Gap (px)
            </label>
            <input
              type="number"
              min={0}
              max={200}
              value={dimensionConfig.custom?.gap || 16}
              onChange={(e) => handleGapChange(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
              disabled={disabled}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Height Input(s) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Height{!heightsLocked && 's'} (px)
              </label>
              <button
                onClick={handleToggleHeightsLock}
                disabled={disabled}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: heightsLocked ? 'var(--accent)' : 'var(--text-secondary)',
                }}
                title={heightsLocked ? 'Unlock to set different heights' : 'Lock to set uniform height'}
              >
                {heightsLocked ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
                <span>{heightsLocked ? 'Uniform' : 'Per-segment'}</span>
              </button>
            </div>

            {heightsLocked ? (
              <input
                type="number"
                min={50}
                max={1000}
                value={getUniformHeight()}
                onChange={(e) => handleUniformHeightChange(Math.max(50, Math.min(1000, parseInt(e.target.value) || 253)))}
                disabled={disabled}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            ) : (
              <div className="space-y-2">
                {Array.from({ length: segments }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs font-display font-semibold flex-shrink-0"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <input
                      type="number"
                      min={50}
                      max={1000}
                      value={dimensionConfig.custom?.segmentHeights[index] || 253}
                      onChange={(e) => handleSegmentHeightChange(index, Math.max(50, Math.min(1000, parseInt(e.target.value) || 253)))}
                      disabled={disabled}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
                      style={{
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              {target.width} × {
                // Show single height if uniform, or range if variable
                new Set(target.segmentHeights).size === 1
                  ? target.segmentHeights[0]
                  : `${Math.min(...target.segmentHeights)}–${Math.max(...target.segmentHeights)}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gap removed</span>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>
              {target.gap}px × {target.gapCount}
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
