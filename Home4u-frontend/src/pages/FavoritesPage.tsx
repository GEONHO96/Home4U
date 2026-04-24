import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyFavorites } from '../api/favoriteApi';
import type { Favorite } from '../types/favorite';
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

function FavoritesPage() {
  const userIdRaw = localStorage.getItem('userId');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  const [items, setItems] = useState<Favorite[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    listMyFavorites(userId)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : '찜 목록을 불러오지 못했습니다.'));
  }, [userId]);

  if (!userId) {
    return (
      <section className="container-narrow" style={{ padding: '2.5rem 1.25rem' }}>
        <h1>찜한 매물</h1>
        <div className="alert alert-error" role="alert">로그인이 필요합니다.</div>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>찜한 매물</h1>
      <p className="muted" style={{ marginBottom: '1.1rem' }}>마음에 든 매물을 한곳에서 확인하세요.</p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {items === null ? (
        <p className="muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>아직 찜한 매물이 없습니다.</div></div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {items.map((fav) => {
            const p = fav.property;
            if (!p) return null;
            return (
              <li key={fav.id}>
                <Link to={`/properties/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article className="card">
                    <div className="thumb" style={{ aspectRatio: '16/10' }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span>No image</span>}
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.25rem' }}>
                        <span className="badge">{labelOf(PROPERTY_TYPES, p.propertyType)}</span>
                        <span className="badge badge-accent">{labelOf(TRANSACTION_TYPES, p.transactionType)}</span>
                        {p.isSold && <span className="badge badge-sold">거래완료</span>}
                      </div>
                      <div className="price">{formatPriceHuman(p.price)}</div>
                      <h3 style={{ margin: '0.15rem 0 0.1rem', fontSize: '0.98rem' }}>{p.title}</h3>
                      <p className="subtle" style={{ margin: 0, fontSize: '0.82rem' }}>{p.address}</p>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default FavoritesPage;
