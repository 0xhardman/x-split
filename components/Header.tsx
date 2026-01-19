'use client';

import NavTabs from './NavTabs';

export default function Header() {
  return (
    <header
      className="flex-shrink-0 px-6 py-4 flex items-center justify-between"
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
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
            <a
              href="https://x-split.0xhardman.xyz"
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              x-split.0xhardman.xyz
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <NavTabs />
      </div>

      <div className="flex items-center gap-3">
        {/* Zoom hint */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)'
          }}
        >
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            ⌘
          </kbd>
          <span>+</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            -/+
          </kbd>
          <span>zoom</span>
        </div>

        {/* Twitter link */}
        <a
          href="https://x.com/0xhardman"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors hover:opacity-80"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>@0xhardman</span>
        </a>
      </div>
    </header>
  );
}
