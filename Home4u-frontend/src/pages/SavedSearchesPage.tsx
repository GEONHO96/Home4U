import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteSavedSearch,
  getMatchingProperties,
  listMySavedSearches,
  type SavedSearch,
} from '../api/savedSearchApi';
import { PROPERTY_TYPES, ROOM_STRUCTURES, TRANSACTION_TYPES } from '../types/property';
import type { Property } from '../types/property';

function labelOf<T extends string>(opts: { value: T; label: string }[], v?: T): string {
  if (!v) return '전체';
  return opts.find((o) => o.value === v)?.label ?? v;
}

function summary(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.transactionType) parts.push(labelOf(TRANSACTION_TYPES, s.transactionType));
  if (s.roomStructure) parts.push(labelOf(ROOM_STRUCTURES, s.roomStructure));
  if (s.minArea != null || s.maxArea != null) {
    parts.push(`${s.minArea ?? '-'}~${s.maxArea ?? '-'}㎡`);
  }
  if (s.minFloor != null || s.maxFloor != null) {
    parts.push(`${s.minFloor ?? '-'}~${s.maxFloor ?? '-'}층`);
  }
  if (s.keyword) parts.push(`"${s.keyword}"`);
  if (s.minLat != null && s.maxLat != null) parts.push('지도 영역');
  return parts.length ? parts.join(' · ') : '조건 없음';
}

function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
}

export default function SavedSearchesPage() {
  const navigate = useNavigate();
  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;
  const [items, setItems] = useState<SavedSearch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchingFor, setMatchingFor] = useState<number | null>(null);
  const [matchingItems, setMatchingItems] = useState<Property[] | null>(null);

  const load = useCallback(async () => {
    if (!myUserId) return;
    try {
      setItems(await listMySavedSearches(myUserId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
      setItems([]);
    }
  }, [myUserId]);

  useEffect(() => { load(); }, [load]);

  if (!myUserId) {
    return (
      <section className="container-narrow" style={{ padding: '2.5rem 1.25rem' }}>
        <h1>저장된 검색</h1>
        <div className="alert alert-error" role="alert">로그인이 필요합니다.</div>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  const onDelete = async (id: number) => {
    if (!confirm('이 검색 조건을 삭제할까요?')) return;
    try {
      await deleteSavedSearch(id, myUserId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const onMatching = async (id: number) => {
    setMatchingFor(id);
    setMatchingItems(null);
    try {
      setMatchingItems(await getMatchingProperties(id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '매칭 조회 실패');
      setMatchingItems([]);
    }
  };

  return (
    <section className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>저장된 검색</h1>
      <p className="muted" style={{ marginBottom: '1.1rem' }}>
        자주 쓰는 조건을 저장하고, 매칭되는 매물을 즉시 확인할 수 있습니다.
      </p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {items === null ? (
        <p className="muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          아직 저장한 검색이 없습니다. 매물 목록 페이지 상단의 "조건 저장" 버튼으로 추가하세요.
        </div></div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.7rem' }}>
          {items.map((s) => (
            <li key={s.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong>{s.name}</strong>
                  <span className="muted" style={{ fontSize: '0.82rem' }}>
                    {new Date(s.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button type="button" onClick={() => onMatching(s.id)} className="primary">매칭 매물 보기</button>
                  <button type="button" onClick={() => onDelete(s.id)} className="danger">삭제</button>
                </div>
                <p className="subtle" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                  {summary(s)}
                </p>

                {matchingFor === s.id && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    {matchingItems === null ? (
                      <p className="muted">조회 중…</p>
                    ) : matchingItems.length === 0 ? (
                      <p className="muted">이 조건에 맞는 매물이 없습니다.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                        {matchingItems.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => navigate(`/properties/${p.id}`)}
                              style={{ textAlign: 'left', width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                              <span className="badge">{labelOf(PROPERTY_TYPES, p.propertyType)}</span>
                              <span className="badge badge-accent">{labelOf(TRANSACTION_TYPES, p.transactionType)}</span>
                              <span style={{ fontWeight: 700 }}>{formatPriceHuman(p.price)}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}>{p.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
