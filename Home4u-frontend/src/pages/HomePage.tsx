import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { PROPERTY_TYPES, TRANSACTION_TYPES } from '../types/property';

function labelOf<T extends string>(opts: { value: T; label: string }[], v: T): string {
  return opts.find((o) => o.value === v)?.label ?? v;
}

function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
}

function HomePage() {
  const username = localStorage.getItem('username');
  const recent = useRecentlyViewed();

  return (
    <section className="container" style={{ padding: '3rem 1.25rem' }}>
      <div style={{ maxWidth: 640 }}>
        <span className="badge badge-accent" style={{ marginBottom: '0.75rem' }}>
          Home4U · 부동산 매물 거래
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', lineHeight: 1.2 }}>
          지도에서 찾고,<br />한 번의 클릭으로 거래까지.
        </h1>
        <p className="muted" style={{ fontSize: '1rem', maxWidth: 560, marginTop: '0.5rem' }}>
          공인중개사는 매물을 올리고 들어온 거래를 관리합니다. 구매자는 지역과 조건으로
          지도 위에서 필터링하고 원클릭으로 거래를 요청합니다. 리뷰로 다음 사용자를 돕습니다.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <Link
            to="/properties"
            style={{
              textDecoration: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            지도에서 매물 보기 →
          </Link>
          {!username && (
            <Link
              to="/register"
              style={{
                textDecoration: 'none',
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-text)',
                fontWeight: 600,
              }}
            >
              회원가입
            </Link>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>최근 본 매물</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>{recent.length}건</span>
          </div>
          <ul style={{
            listStyle: 'none', padding: 0, margin: 0,
            display: 'grid', gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          }}>
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`/properties/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article className="card">
                    <div className="thumb" style={{ aspectRatio: '16/10' }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span>No image</span>}
                    </div>
                    <div className="card-body" style={{ padding: '0.85rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem' }}>
                        <span className="badge">{labelOf(PROPERTY_TYPES, p.propertyType)}</span>
                        <span className="badge badge-accent">{labelOf(TRANSACTION_TYPES, p.transactionType)}</span>
                        {p.isSold && <span className="badge badge-sold">거래완료</span>}
                      </div>
                      <div className="price" style={{ fontSize: '1.05rem' }}>{formatPriceHuman(p.price)}</div>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.88rem' }}>{p.title}</p>
                      <p className="subtle" style={{ margin: 0, fontSize: '0.78rem' }}>{p.address}</p>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Feature title="지도 중심 탐색" body="지역 프리셋과 지도 마커로 원하는 곳의 매물만 빠르게 훑어봅니다." />
        <Feature title="원클릭 거래" body="상세에서 단일 버튼으로 거래 요청. 승인되면 [거래완료]로 자동 전환." />
        <Feature title="찜 & 최근 본 매물" body="마음에 든 매물은 ♥ 로 저장하고, 방금 본 매물은 홈에서 이어보기." />
      </div>
    </section>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{title}</h3>
        <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>{body}</p>
      </div>
    </div>
  );
}

export default HomePage;
