import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPropertyById } from '../api/propertyApi';
import type { Property } from '../types/property';
import { PROPERTY_TYPES, TRANSACTION_TYPES, ROOM_STRUCTURES } from '../types/property';

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPropertyById(Number(id))
      .then(setItem)
      .catch((err) => {
        setError(err.response?.status === 403
          ? '로그인이 필요합니다.'
          : err.message ?? '매물을 불러오지 못했습니다.');
      });
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!item) return <p>불러오는 중…</p>;

  return (
    <section>
      <Link to="/properties">← 목록으로</Link>
      <h2>
        {item.title}
        {item.isSold && <span style={{ marginLeft: 8, color: '#c00' }}>[거래완료]</span>}
      </h2>

      <dl>
        <dt>가격</dt><dd>{item.price.toLocaleString()}만원</dd>
        <dt>주소</dt><dd>{item.address}</dd>
        <dt>건물 유형</dt><dd>{labelOf(PROPERTY_TYPES, item.propertyType)}</dd>
        <dt>거래 유형</dt><dd>{labelOf(TRANSACTION_TYPES, item.transactionType)}</dd>
        <dt>층수</dt><dd>{item.floor}층</dd>
        <dt>전용면적</dt><dd>{item.minArea}㎡ ~ {item.maxArea}㎡</dd>
        {item.roomStructure && (
          <>
            <dt>방 구조</dt>
            <dd>{labelOf(ROOM_STRUCTURES, item.roomStructure)}</dd>
          </>
        )}
        <dt>설명</dt><dd>{item.description}</dd>
      </dl>
    </section>
  );
}

export default PropertyDetailPage;
