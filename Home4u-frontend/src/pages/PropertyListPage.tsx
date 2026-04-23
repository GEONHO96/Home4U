import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProperties } from '../api/propertyApi';
import type { Property } from '../types/property';
import { PROPERTY_TYPES, TRANSACTION_TYPES } from '../types/property';

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function PropertyListPage() {
  const [items, setItems] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllProperties()
      .then(setItems)
      .catch((err) => {
        setError(err.response?.status === 403
          ? '로그인이 필요합니다.'
          : err.message ?? '매물을 불러오지 못했습니다.');
      });
  }, []);

  if (error) {
    return (
      <section>
        <h2>매물 목록</h2>
        <p role="alert">{error}</p>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  if (items === null) {
    return <p>불러오는 중…</p>;
  }

  const role = localStorage.getItem('role');

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>매물 목록</h2>
        {role === 'ROLE_REALTOR' && (
          <Link to="/properties/new">+ 매물 등록</Link>
        )}
      </div>

      {items.length === 0 ? (
        <p>등록된 매물이 아직 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((p) => (
            <li key={p.id} style={{ border: '1px solid #ddd', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: 4 }}>
              <Link to={`/properties/${p.id}`} style={{ textDecoration: 'none' }}>
                <strong>{p.title}</strong>
                {p.isSold && <span style={{ marginLeft: 8, color: '#c00' }}>[거래완료]</span>}
                <div style={{ fontSize: '0.9em', color: '#555' }}>
                  {labelOf(PROPERTY_TYPES, p.propertyType)} · {labelOf(TRANSACTION_TYPES, p.transactionType)} · {p.price.toLocaleString()}만원
                </div>
                <div style={{ fontSize: '0.85em', color: '#777' }}>{p.address}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PropertyListPage;
