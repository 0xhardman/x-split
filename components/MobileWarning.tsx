'use client';

export default function MobileWarning() {
  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden flex-col items-center justify-center p-6 text-center"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: 'var(--accent)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1
        className="font-display font-bold text-2xl mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        Desktop Only
      </h1>

      {/* Description */}
      <p
        className="text-sm max-w-xs leading-relaxed mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        X-Split is designed for desktop browsers. Please open this page on a computer for the best experience.
      </p>

      {/* Logo */}
      <div className="flex items-center gap-2 opacity-50">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #0088aa 100%)',
            opacity: 0.15,
          }}
        >
          <span className="font-display font-bold text-sm text-accent">X</span>
        </div>
        <span
          className="font-display font-semibold text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          X-Split
        </span>
      </div>
    </div>
  );
}
