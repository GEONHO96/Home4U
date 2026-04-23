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
      <section>
        <h2>매물 등록</h2>
        <p role="alert">공인중개사(ROLE_REALTOR) 계정만 매물을 등록할 수 있습니다.</p>
      </section>
    );
  }

  const ownerId = Number(ownerIdRaw);
  if (!ownerId) {
    return (
      <section>
        <h2>매물 등록</h2>
        <p role="alert">로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.</p>
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
    <section>
      <h2>매물 등록</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 480 }}>
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
          구/군
          <input required value={form.gungu} onChange={(e) => update('gungu', e.target.value)} />
        </label>
        <label>
          동
          <input required value={form.dong} onChange={(e) => update('dong', e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={{ flex: 1 }}>
            위도
            <input required type="number" step="any" value={form.latitude} onChange={(e) => update('latitude', Number(e.target.value))} />
          </label>
          <label style={{ flex: 1 }}>
            경도
            <input required type="number" step="any" value={form.longitude} onChange={(e) => update('longitude', Number(e.target.value))} />
          </label>
        </div>
        <label>
          층수
          <input required type="number" value={form.floor} onChange={(e) => update('floor', Number(e.target.value))} />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={{ flex: 1 }}>
            최소 면적 (㎡)
            <input required type="number" step="any" min={0} value={form.minArea} onChange={(e) => update('minArea', Number(e.target.value))} />
          </label>
          <label style={{ flex: 1 }}>
            최대 면적 (㎡)
            <input required type="number" step="any" min={0} value={form.maxArea} onChange={(e) => update('maxArea', Number(e.target.value))} />
          </label>
        </div>
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
        <fieldset>
          <legend>추가 옵션</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {ADDITIONAL_OPTIONS.map((o) => (
              <label key={o.value} style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.additionalOptions?.includes(o.value) ?? false}
                  onChange={() => toggleOption(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p role="alert" style={{ color: '#c00' }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? '등록 중…' : '등록'}
        </button>
      </form>
    </section>
  );
}

export default PropertyCreatePage;
