import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'X-Split - Twitter Long Image Splitter';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #00b4d8 0%, #0088aa 100%)',
            marginBottom: 32,
          }}
        >
          <span style={{ color: '#0a0a0a', fontSize: 72, fontWeight: 700 }}>X</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 16,
            }}
          >
            X-Split
          </span>
          <span
            style={{
              fontSize: 32,
              color: '#a0a0a0',
              textAlign: 'center',
            }}
          >
            Twitter Long Image Splitter
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 48,
            padding: '16px 32px',
            borderRadius: 16,
            background: 'rgba(0, 180, 216, 0.1)',
            border: '1px solid rgba(0, 180, 216, 0.3)',
          }}
        >
          <span style={{ color: '#00b4d8', fontSize: 24 }}>
            Tap the post • 4×1
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
