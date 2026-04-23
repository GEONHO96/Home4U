import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPropertyById } from '../api/propertyApi';
import { requestTransaction } from '../api/transactionApi';
import ReviewSection from '../components/ReviewSection';
import type { Property } from '../types/property';
import { PROPERTY_TYPES, TRANSACTION_TYPES, ROOM_STRUCTURES } from '../types/property';

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

type ActionMsg = { type: 'success' | 'error'; text: string };

function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionMsg | null>(null);
  const [busy, setBusy] = useState(false);

  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;

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

  const isOwner = myUserId != null && myUserId === (item as Property & { ownerId?: number }).ownerId;

  const handleRequestTransaction = async () => {
    if (!myUserId || !item.id) return;
    setBusy(true);
    setAction(null);
    try {
      const tx = await requestTransaction(item.id, myUserId);
      setAction({ type: 'success', text: `거래 요청이 접수됐습니다. (거래 번호 ${tx.id}, 상태 ${tx.status})` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '거래 요청 실패';
      setAction({ type: 'error', text: msg });
    } finally {
      setBusy(false);
    }
  };

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

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {myUserId == null && (
          <Link to="/login">거래하려면 로그인</Link>
        )}
        {myUserId != null && !isOwner && !item.isSold && (
          <button type="button" onClick={handleRequestTransaction} disabled={busy}>
            {busy ? '요청 중…' : '거래 요청하기'}
          </button>
        )}
        {myUserId != null && isOwner && (
          <button type="button" onClick={() => navigate('/transactions/me')}>
            내가 받은 거래 요청 보기
          </button>
        )}
      </div>

      {action && (
        <p
          role="alert"
          style={{ marginTop: '0.5rem', color: action.type === 'success' ? '#0a7' : '#c00' }}
        >
          {action.text}
        </p>
      )}

      {item.id && <ReviewSection propertyId={item.id} />}
    </section>
  );
}

export default PropertyDetailPage;
