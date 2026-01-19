'use client';

interface CropControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isModified: boolean;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export default function CropControls({
  zoom,
  minZoom,
  maxZoom,
  canZoomIn,
  canZoomOut,
  isModified,
  onZoomChange,
  onReset,
}: CropControlsProps) {
  const percentage = Math.round(zoom * 100);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Zoom out button */}
      <button
        onClick={() => onZoomChange(zoom / 1.2)}
        disabled={!canZoomOut}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: canZoomOut ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
          color: canZoomOut ? 'var(--text-secondary)' : 'var(--text-muted)',
          border: '1px solid var(--border)',
          cursor: canZoomOut ? 'pointer' : 'not-allowed',
          opacity: canZoomOut ? 1 : 0.5,
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      {/* Zoom slider */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Zoom
        </span>
        <input
          type="range"
          min={minZoom * 100}
          max={maxZoom * 100}
          value={zoom * 100}
          onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, var(--bg-elevated) ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, var(--bg-elevated) 100%)`,
          }}
        />
        <span
          className="text-xs font-mono w-12 text-right"
          style={{ color: 'var(--text-secondary)' }}
        >
          {percentage}%
        </span>
      </div>

      {/* Zoom in button */}
      <button
        onClick={() => onZoomChange(zoom * 1.2)}
        disabled={!canZoomIn}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: canZoomIn ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
          color: canZoomIn ? 'var(--text-secondary)' : 'var(--text-muted)',
          border: '1px solid var(--border)',
          cursor: canZoomIn ? 'pointer' : 'not-allowed',
          opacity: canZoomIn ? 1 : 0.5,
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: 'var(--border)' }} />

      {/* Reset button */}
      <button
        onClick={onReset}
        disabled={!isModified}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: isModified ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: isModified ? 'white' : 'var(--text-muted)',
          cursor: isModified ? 'pointer' : 'not-allowed',
          opacity: isModified ? 1 : 0.5,
        }}
      >
        Reset
      </button>
    </div>
  );
}
