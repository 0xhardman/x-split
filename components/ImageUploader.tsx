'use client';

import { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

export default function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const img = new Image();
      img.onload = () => {
        onImageLoad(img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-xl p-5 cursor-pointer transition-all duration-300
          ${isDragging ? 'upload-zone-active' : 'upload-zone'}
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          {preview ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-28 rounded-lg shadow-lg"
                  style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}
                />
                {/* Decorative corner accents */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 rounded-tl"
                  style={{ borderColor: 'var(--accent)' }}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 rounded-tr"
                  style={{ borderColor: 'var(--accent)' }}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 rounded-bl"
                  style={{ borderColor: 'var(--accent)' }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 rounded-br"
                  style={{ borderColor: 'var(--accent)' }}
                />
              </div>
              <p
                className="text-xs truncate max-w-full px-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {fileName}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Click to replace
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-3">
              {/* Upload icon */}
              <div
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Drop your image here
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  or click to browse
                </p>
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)'
                }}
              >
                <span>PNG</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>JPG</span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span>WebP</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
