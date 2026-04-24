import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  filterProperties,
  getAllProperties,
  searchPropertiesByCoordinates,
  type FilterParams,
} from '../api/propertyApi';
import type { Property, RoomStructure, TransactionType } from '../types/property';
import {
  PROPERTY_TYPES,
  ROOM_STRUCTURES,
  TRANSACTION_TYPES,
} from '../types/property';

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

const REGION_PRESETS = [
  { label: '서울 전체', minLat: 37.42, maxLat: 37.70, minLng: 126.76, maxLng: 127.18 },
  { label: '강남구', minLat: 37.47, maxLat: 37.54, minLng: 127.00, maxLng: 127.10 },
  { label: '마포구', minLat: 37.54, maxLat: 37.58, minLng: 126.87, maxLng: 126.96 },
] as const;

function PropertyListPage() {
  const [items, setItems] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterParams>({});
  const [applied, setApplied] = useState<'none' | 'filter' | 'region'>('none');
  const [appliedLabel, setAppliedLabel] = useState<string>('');

  const role = localStorage.getItem('role');

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      setItems(await getAllProperties());
      setApplied('none');
      setAppliedLabel('');
    } catch (err) {
      handleErr(err);
    }
  }, []);

  const handleErr = (err: unknown) => {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr?.response?.status === 403) {
      setError('로그인이 필요합니다.');
    } else {
      setError(anyErr?.message ?? '매물을 불러오지 못했습니다.');
    }
    setItems([]);
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApplyFilter = async () => {
    setError(null);
    try {
      const data = await filterProperties(filter);
      setItems(data);
      setApplied('filter');
      const parts: string[] = [];
      if (filter.transactionType) parts.push(labelOf(TRANSACTION_TYPES, filter.transactionType));
      if (filter.roomStructure) parts.push(labelOf(ROOM_STRUCTURES, filter.roomStructure));
      if (filter.minArea != null || filter.maxArea != null) {
        parts.push(`${filter.minArea ?? '-'}~${filter.maxArea ?? '-'}㎡`);
      }
      if (filter.minFloor != null || filter.maxFloor != null) {
        parts.push(`${filter.minFloor ?? '-'}~${filter.maxFloor ?? '-'}층`);
      }
      setAppliedLabel(parts.length ? parts.join(' · ') : '조건 없음');
    } catch (err) {
      handleErr(err);
    }
  };

  const handlePreset = async (preset: typeof REGION_PRESETS[number]) => {
    setError(null);
    try {
      const data = await searchPropertiesByCoordinates(preset);
      setItems(data);
      setApplied('region');
      setAppliedLabel(preset.label);
    } catch (err) {
      handleErr(err);
    }
  };

  const update = <K extends keyof FilterParams>(k: K, v: FilterParams[K]) =>
    setFilter((prev) => ({ ...prev, [k]: v }));

  return (
    <section className="container" style={{ padding: '2.25rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>매물 목록</h1>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            지역과 조건으로 필터링해 원하는 매물을 찾아보세요.
          </p>
        </div>
        {role === 'ROLE_REALTOR' && (
          <Link
            to="/properties/new"
            style={{
              textDecoration: 'none',
              padding: '0.55rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-text)',
              color: 'var(--color-bg-elev)',
              fontSize: '0.9rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            + 매물 등록
          </Link>
        )}
      </div>

      <details className="panel" style={{ marginBottom: '1rem' }} open>
        <summary>검색 · 필터</summary>

        <div style={{ marginTop: '0.85rem' }}>
          <div className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>지역 프리셋</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {REGION_PRESETS.map((p) => (
              <button key={p.label} type="button" className="ghost" onClick={() => handlePreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: '0.85rem',
            display: 'grid',
            gap: '0.65rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          }}
        >
          <label>
            거래 유형
            <select
              name="transactionType"
              value={filter.transactionType ?? ''}
              onChange={(e) => update('transactionType', (e.target.value || undefined) as TransactionType | undefined)}
            >
              <option value="">전체</option>
              {TRANSACTION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>
            방 구조
            <select
              name="roomStructure"
              value={filter.roomStructure ?? ''}
              onChange={(e) => update('roomStructure', (e.target.value || undefined) as RoomStructure | undefined)}
            >
              <option value="">전체</option>
              {ROOM_STRUCTURES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>
            최소 면적 (㎡)
            <input
              name="minArea"
              type="number"
              value={filter.minArea ?? ''}
              onChange={(e) => update('minArea', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </label>
          <label>
            최대 면적 (㎡)
            <input
              name="maxArea"
              type="number"
              value={filter.maxArea ?? ''}
              onChange={(e) => update('maxArea', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </label>
          <label>
            최소 층수
            <input
              name="minFloor"
              type="number"
              value={filter.minFloor ?? ''}
              onChange={(e) => update('minFloor', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </label>
          <label>
            최대 층수
            <input
              name="maxFloor"
              type="number"
              value={filter.maxFloor ?? ''}
              onChange={(e) => update('maxFloor', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </label>
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="accent" onClick={handleApplyFilter}>필터 적용</button>
          <button type="button" className="ghost" onClick={() => { setFilter({}); loadAll(); }}>초기화</button>
        </div>
      </details>

      {appliedLabel && (
        <p
          className="muted"
          style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.85rem' }}
          data-testid="applied-label"
        >
          {applied === 'region' ? '지역: ' : '필터: '}{appliedLabel}
        </p>
      )}

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {items === null ? (
        <p className="muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {applied === 'none' ? '등록된 매물이 아직 없습니다.' : '조건에 맞는 매물이 없습니다.'}
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          }}
        >
          {items.map((p) => (
            <li key={p.id}>
              <Link
                to={`/properties/${p.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <article className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span className="badge">{labelOf(PROPERTY_TYPES, p.propertyType)}</span>
                    <span className="badge">{labelOf(TRANSACTION_TYPES, p.transactionType)}</span>
                    {p.isSold && <span className="badge badge-sold">거래완료</span>}
                  </div>
                  <h3 style={{ margin: '0.1rem 0 0.35rem', fontSize: '1.1rem' }}>{p.title}</h3>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 600 }}>
                    {p.price.toLocaleString()}<span className="muted" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-sans)' }}> 만원</span>
                  </div>
                  <p className="subtle" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                    {p.address}
                  </p>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default PropertyListPage;
