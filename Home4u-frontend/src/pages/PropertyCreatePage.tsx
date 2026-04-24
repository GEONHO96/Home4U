import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProperty } from '../api/propertyApi';
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  ROOM_STRUCTURES,
  ADDITIONAL_OPTIONS,
} from '../types/property';
import type {
  AdditionalOption,
  PropertyCreateRequest,
  PropertyType,
  RoomStructure,
  TransactionType,
} from '../types/property';

const INITIAL: PropertyCreateRequest = {
  title: '',
  description: '',
  price: 0,
  address: '',
  latitude: 37.5,
  longitude: 127.0,
  dong: '',
  gungu: '',
  floor: 1,
  minArea: 0,
  maxArea: 0,
  propertyType: 'APARTMENT',
  transactionType: 'SALE',
  roomStructure: undefined,
  additionalOptions: [],
  imageUrl: '',
  imageUrls: [],
};

function PropertyCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<PropertyCreateRequest>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = localStorage.getItem('role');
  const ownerIdRaw = localStorage.getItem('userId');

  if (role !== 'ROLE_REALTOR') {
    return (
      <section className="container-narrow" style={{ padding: '2rem 1.25rem' }}>
        <h1>매물 등록</h1>
        <div className="alert alert-error" role="alert">
          공인중개사(ROLE_REALTOR) 계정만 매물을 등록할 수 있습니다.
        </div>
      </section>
    );
  }

  const ownerId = Number(ownerIdRaw);
  if (!ownerId) {
    return (
      <section className="container-narrow" style={{ padding: '2rem 1.25rem' }}>
        <h1>매물 등록</h1>
        <div className="alert alert-error" role="alert">
          로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.
        </div>
      </section>
    );
  }

  const update = <K extends keyof PropertyCreateRequest>(
    key: K,
    value: PropertyCreateRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleOption = (opt: AdditionalOption) => {
    setForm((prev) => {
      const cur = prev.additionalOptions ?? [];
      return {
        ...prev,
        additionalOptions: cur.includes(opt)
          ? cur.filter((o) => o !== opt)
          : [...cur, opt],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await createProperty(form, ownerId);
      navigate(`/properties/${res.propertyId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '등록 실패';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-narrow" style={{ padding: '2.25rem 1.25rem 3rem' }}>
      <h1 style={{ marginBottom: '0.35rem' }}>매물 등록</h1>
      <p className="muted" style={{ marginBottom: '1.25rem' }}>
        입력한 정보는 매물 목록과 상세에 즉시 노출됩니다.
      </p>

      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.85rem' }}>
          <label>
            제목
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} />
          </label>
          <label>
            설명
            <textarea required value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>
          <label>
            가격 (만원)
            <input required type="number" min={0} value={form.price} onChange={(e) => update('price', Number(e.target.value))} />
          </label>
          <label>
            주소
            <input required value={form.address} onChange={(e) => update('address', e.target.value)} />
          </label>
          <label>
            대표 이미지 URL (선택)
            <input
              type="url"
              value={form.imageUrl ?? ''}
              onChange={(e) => update('imageUrl', e.target.value || undefined)}
              placeholder="https://..."
            />
          </label>
          <label>
            이미지 URL (갤러리 · 한 줄에 하나씩)
            <textarea
              value={(form.imageUrls ?? []).join('\n')}
              onChange={(e) => update('imageUrls',
                e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              placeholder={'https://example.com/1.jpg\nhttps://example.com/2.jpg'}
              rows={3}
            />
          </label>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label>
              구/군
              <input required value={form.gungu} onChange={(e) => update('gungu', e.target.value)} />
            </label>
            <label>
              동
              <input required value={form.dong} onChange={(e) => update('dong', e.target.value)} />
            </label>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label>
              위도
              <input required type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', Number(e.target.value))} />
            </label>
            <label>
              경도
              <input required type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', Number(e.target.value))} />
            </label>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            <label>
              층수
              <input required type="number" value={form.floor} onChange={(e) => update('floor', Number(e.target.value))} />
            </label>
            <label>
              최소 면적 (㎡)
              <input required type="number" step="any" min={0} value={form.minArea} onChange={(e) => update('minArea', Number(e.target.value))} />
            </label>
            <label>
              최대 면적 (㎡)
              <input required type="number" step="any" min={0} value={form.maxArea} onChange={(e) => update('maxArea', Number(e.target.value))} />
            </label>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label>
              건물 유형
              <select value={form.propertyType} onChange={(e) => update('propertyType', e.target.value as PropertyType)}>
                {PROPERTY_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              거래 유형
              <select value={form.transactionType} onChange={(e) => update('transactionType', e.target.value as TransactionType)}>
                {TRANSACTION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>
              방 구조 (선택)
              <select
                value={form.roomStructure ?? ''}
                onChange={(e) => update('roomStructure', (e.target.value || undefined) as RoomStructure | undefined)}
              >
                <option value="">-- 선택 안함 --</option>
                {ROOM_STRUCTURES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>추가 옵션</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.75rem' }}>
              {ADDITIONAL_OPTIONS.map((o) => (
                <label key={o.value} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text)' }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto', margin: 0 }}
                    checked={form.additionalOptions?.includes(o.value) ?? false}
                    onChange={() => toggleOption(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? '등록 중…' : '매물 등록'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default PropertyCreatePage;
