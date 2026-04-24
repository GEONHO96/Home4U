import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import MapView from '../components/MapView';
import FavoriteButton from '../components/FavoriteButton';

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

function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10
      ? `${Math.round(eok).toLocaleString()}억`
      : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
}

function PropertyListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterParams>({});
  const [keyword, setKeyword] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [view, setView] = useState<'split' | 'list' | 'map'>('split');

  const role = localStorage.getItem('role');

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      setItems(await getAllProperties());
    } catch (err) {
      handleErr(err);
    }
  }, []);

  const handleErr = (err: unknown) => {
    const anyErr = err as { response?: { status?: number }; message?: string };
    setError(anyErr?.response?.status === 403 ? '로그인이 필요합니다.' : anyErr?.message ?? '매물을 불러오지 못했습니다.');
    setItems([]);
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleApplyFilter = async () => {
    try {
      setItems(await filterProperties(filter));
    } catch (err) { handleErr(err); }
  };

  const handlePreset = async (preset: typeof REGION_PRESETS[number]) => {
    try {
      setItems(await searchPropertiesByCoordinates(preset));
    } catch (err) { handleErr(err); }
  };

  const filtered = useMemo(() => {
    if (!items) return [];
    const kw = keyword.trim().toLowerCase();
    if (!kw) return items;
    return items.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.address.toLowerCase().includes(kw) ||
        p.gungu.toLowerCase().includes(kw) ||
        p.dong.toLowerCase().includes(kw),
    );
  }, [items, keyword]);

  const update = <K extends keyof FilterParams>(k: K, v: FilterParams[K]) =>
    setFilter((prev) => ({ ...prev, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-h))' }}>
      {/* Search & chips header */}
      <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0.75rem 1rem', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
            <input
              type="search"
              placeholder="지역 · 매물명으로 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <span aria-hidden style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)' }}>⌕</span>
          </div>

          <ChipFilterTx value={filter.transactionType} onChange={(v) => update('transactionType', v)} />
          <ChipFilterRoom value={filter.roomStructure} onChange={(v) => update('roomStructure', v)} />
          <ChipFilterArea filter={filter} onChange={(next) => setFilter((p) => ({ ...p, ...next }))} />
          <button type="button" className="primary" onClick={handleApplyFilter}>적용</button>
          <button type="button" className="ghost" onClick={() => { setFilter({}); setKeyword(''); loadAll(); }}>초기화</button>

          <span style={{ flex: 1 }} />
          <div role="tablist" aria-label="view switcher" style={{ display: 'flex', gap: '0.25rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', padding: 2 }}>
            {(['split', 'list', 'map'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="ghost"
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.82rem',
                  background: view === v ? 'var(--color-text)' : 'transparent',
                  color: view === v ? 'var(--color-bg-elev)' : 'var(--color-text)',
                  border: 'none',
                }}
              >
                {v === 'split' ? '리스트+지도' : v === 'list' ? '리스트' : '지도'}
              </button>
            ))}
          </div>
          {role === 'ROLE_REALTOR' && (
            <Link
              to="/properties/new"
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-accent)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              + 매물 등록
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: '0.78rem', alignSelf: 'center' }}>지역 프리셋</span>
          {REGION_PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" onClick={() => handlePreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: list + map */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: view === 'split' ? 'minmax(360px, 42%) 1fr' : view === 'list' ? '1fr' : '1fr', overflow: 'hidden' }}>
        {view !== 'map' && (
          <aside style={{ borderRight: view === 'split' ? '1px solid var(--color-border)' : 'none', overflowY: 'auto' }}>
            {error && <div className="alert alert-error" role="alert" style={{ margin: '1rem' }}>{error}</div>}
            {items === null ? (
              <p className="muted" style={{ padding: '1rem' }}>불러오는 중…</p>
            ) : filtered.length === 0 ? (
              <div className="card" style={{ margin: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div className="card-body">조건에 맞는 매물이 없습니다.</div>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0.75rem', margin: 0, display: 'grid', gap: '0.75rem', gridTemplateColumns: view === 'split' ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {filtered.map((p) => (
                  <li key={p.id}>
                    <article
                      className="card"
                      onMouseEnter={() => setActiveId(p.id)}
                      onClick={() => navigate(`/properties/${p.id}`)}
                      style={{ cursor: 'pointer', border: activeId === p.id ? '1px solid var(--color-accent)' : undefined, boxShadow: activeId === p.id ? 'var(--shadow-md)' : undefined }}
                    >
                      <div className="thumb" style={{ aspectRatio: '16/10' }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span>No image</span>}
                      </div>
                      <div className="card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                          <span className="badge">{labelOf(PROPERTY_TYPES, p.propertyType)}</span>
                          <span className="badge badge-accent">{labelOf(TRANSACTION_TYPES, p.transactionType)}</span>
                          {p.isSold && <span className="badge badge-sold">거래완료</span>}
                          <span style={{ flex: 1 }} />
                          <FavoriteButton propertyId={p.id} variant="icon" />
                        </div>
                        <div className="price">
                          {formatPriceHuman(p.price)}
                        </div>
                        <h3 style={{ margin: '0.15rem 0 0.15rem', fontSize: '0.98rem' }}>{p.title}</h3>
                        <p className="subtle" style={{ margin: 0, fontSize: '0.82rem' }}>{p.address}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
        {view !== 'list' && (
          <div style={{ position: 'relative' }}>
            <MapView
              items={filtered.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))}
              activeId={activeId}
              onSelect={(id) => navigate(`/properties/${id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ------------ sub chips ------------

function ChipFilterTx({ value, onChange }: { value?: TransactionType; onChange: (v: TransactionType | undefined) => void }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as TransactionType | undefined)}
      className="chip"
      style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-pill)', width: 'auto', fontWeight: 500 }}
    >
      <option value="">거래유형 전체</option>
      {TRANSACTION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ChipFilterRoom({ value, onChange }: { value?: RoomStructure; onChange: (v: RoomStructure | undefined) => void }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || undefined) as RoomStructure | undefined)}
      className="chip"
      style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-pill)', width: 'auto', fontWeight: 500 }}
    >
      <option value="">방 구조 전체</option>
      {ROOM_STRUCTURES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ChipFilterArea({ filter, onChange }: { filter: FilterParams; onChange: (patch: Partial<FilterParams>) => void }) {
  return (
    <details className="chip" style={{ position: 'relative' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', color: 'var(--color-text)' }}>
        면적·층수 {filter.minArea || filter.maxArea || filter.minFloor || filter.maxFloor ? '●' : ''}
      </summary>
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 20,
          background: 'var(--color-bg-elev)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: 'repeat(2, 120px)',
          minWidth: 260,
        }}
      >
        <label>
          최소 면적 (㎡)
          <input type="number" value={filter.minArea ?? ''} onChange={(e) => onChange({ minArea: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
        <label>
          최대 면적 (㎡)
          <input type="number" value={filter.maxArea ?? ''} onChange={(e) => onChange({ maxArea: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
        <label>
          최소 층수
          <input type="number" value={filter.minFloor ?? ''} onChange={(e) => onChange({ minFloor: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
        <label>
          최대 층수
          <input type="number" value={filter.maxFloor ?? ''} onChange={(e) => onChange({ maxFloor: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </label>
      </div>
    </details>
  );
}

export default PropertyListPage;
