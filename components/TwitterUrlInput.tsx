'use client';

import { useState } from 'react';

interface TwitterUrlInputProps {
  onImagesLoaded: (urls: string[]) => void;
  disabled?: boolean;
}

export default function TwitterUrlInput({ onImagesLoaded, disabled }: TwitterUrlInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/twitter?url=${encodeURIComponent(url.trim())}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to fetch images');
        return;
      }

      onImagesLoaded(data.images);
      setUrl('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="Paste Twitter/X post URL..."
          disabled={disabled || isLoading}
          className="flex-1 px-3 py-2.5 rounded-lg text-sm"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={disabled || isLoading || !url.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          {isLoading ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            'Import'
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs" style={{ color: '#ff6b6b' }}>
          {error}
        </p>
      )}
    </form>
  );
}
