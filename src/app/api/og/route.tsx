import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || '시글담';
  const poem = searchParams.get('poem') || '';
  const author = searchParams.get('author') || '';
  const flower = searchParams.get('flower') || '🌸';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFF9F3 0%, #FFF5E8 50%, #FFE8CC 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '20px', display: 'flex' }}>{flower}</div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1A1A1A',
            marginBottom: '24px',
            textAlign: 'center',
            display: 'flex',
          }}
        >
          {title}
        </div>
        {poem && (
          <div
            style={{
              fontSize: '20px',
              color: '#444444',
              textAlign: 'center',
              lineHeight: '1.8',
              maxWidth: '600px',
              whiteSpace: 'pre-wrap',
              display: 'flex',
            }}
          >
            {poem.slice(0, 200)}{poem.length > 200 ? '...' : ''}
          </div>
        )}
        {author && (
          <div style={{ fontSize: '16px', color: '#999', marginTop: '24px', display: 'flex' }}>
            — {author}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '14px',
            color: '#D1D1D1',
            display: 'flex',
          }}
        >
          시글담 — 나만의 시를 담다
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
