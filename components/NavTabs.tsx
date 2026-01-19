'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Split', icon: 'split' },
  { href: '/merge', label: 'Merge', icon: 'merge' },
] as const;

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium
              transition-all duration-200
              ${isActive ? 'segment-btn-active text-white' : 'hover:bg-[var(--bg-elevated)]'}
            `}
            style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
          >
            {tab.icon === 'split' ? (
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
