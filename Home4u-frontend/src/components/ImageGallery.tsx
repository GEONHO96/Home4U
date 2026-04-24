import { useState } from 'react';

interface Props {
  imageUrls?: string[];
  fallbackUrl?: string;
}

/**
 * 간단한 매물 이미지 갤러리.
 * - imageUrls 가 없으면 fallbackUrl 한 장 (그것도 없으면 placeholder)
 * - 다수면 메인 1장 + 하단 썸네일 스트립, 썸네일 클릭 시 메인 교체
 * - ← / → 키/버튼으로 이동
 */
export default function ImageGallery({ imageUrls, fallbackUrl }: Props) {
  const images: string[] = imageUrls && imageUrls.length > 0
    ? imageUrls
    : fallbackUrl
    ? [fallbackUrl]
    : [];

  const [index, setIndex] = useState(0);
  const safeIndex = images.length === 0 ? 0 : ((index % images.length) + images.length) % images.length;

  if (images.length === 0) {
    return (
      <div className="thumb" style={{ aspectRatio: '16/9' }}>
        <span>이미지 없음</span>
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div>
      <div className="thumb" style={{ aspectRatio: '16/9', position: 'relative' }}>
        <img src={images[safeIndex]} alt={`매물 이미지 ${safeIndex + 1}`} />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="이전 이미지"
              className="ghost"
              style={{
                position: 'absolute', top: '50%', left: '0.5rem', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.85)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)', padding: '0.25rem 0.55rem', fontSize: '1rem', fontWeight: 700,
              }}
            >‹</button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="다음 이미지"
              className="ghost"
              style={{
                position: 'absolute', top: '50%', right: '0.5rem', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.85)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)', padding: '0.25rem 0.55rem', fontSize: '1rem', fontWeight: 700,
              }}
            >›</button>
            <div
              aria-hidden
              style={{
                position: 'absolute', bottom: '0.5rem', right: '0.6rem',
                background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.78rem',
                padding: '0.12rem 0.55rem', borderRadius: 'var(--radius-pill)',
              }}
            >
              {safeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
          }}
        >
          {images.map((url, i) => (
            <button
              type="button"
              key={`${i}-${url}`}
              onClick={() => setIndex(i)}
              className="ghost"
              aria-label={`${i + 1}번 이미지로 이동`}
              style={{
                padding: 0,
                flex: '0 0 auto',
                width: 72,
                height: 54,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: i === safeIndex ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              }}
            >
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
