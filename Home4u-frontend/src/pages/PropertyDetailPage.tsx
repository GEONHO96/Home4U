import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPropertyById } from '../api/propertyApi';
import { requestTransaction } from '../api/transactionApi';
import ReviewSection from '../components/ReviewSection';
import FavoriteButton from '../components/FavoriteButton';
import ImageGallery from '../components/ImageGallery';
import NearbyPanel from '../components/NearbyPanel';
import DealChart from '../components/DealChart';
import { pushRecentlyViewed } from '../hooks/useRecentlyViewed';
import type { Property } from '../types/property';
import { PROPERTY_TYPES, TRANSACTION_TYPES, ROOM_STRUCTURES } from '../types/property';

function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatPriceHuman(price: number): string {
  if (price >= 10000) {
    const eok = price / 10000;
    return eok >= 10 ? `${Math.round(eok)}억` : `${eok.toFixed(1).replace(/\.0$/, '')}억`;
  }
  return `${price.toLocaleString()}만원`;
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
      .then((p) => {
        setItem(p);
        pushRecentlyViewed(p);
      })
      .catch((err) => {
        setError(err.response?.status === 403
          ? '로그인이 필요합니다.'
          : err.message ?? '매물을 불러오지 못했습니다.');
      });
  }, [id]);

  if (error) return (
    <section className="container-narrow" style={{ padding: '2rem 1.25rem' }}>
      <div className="alert alert-error" role="alert">{error}</div>
    </section>
  );
  if (!item) return <p className="container muted" style={{ padding: '2rem 1.25rem' }}>불러오는 중…</p>;

  const isOwner = myUserId != null && myUserId === (item as Property & { ownerId?: number }).ownerId;
  const views = (item as Property & { views?: number }).views ?? 0;

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
    <section className="container-narrow" style={{ padding: '1.5rem 1.25rem 3rem' }}>
      <Link to="/properties" className="muted" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
        ← 매물 목록
      </Link>

      <div className="card" style={{ marginTop: '0.75rem' }}>
        <ImageGallery imageUrls={item.imageUrls} fallbackUrl={item.imageUrl} />
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span className="badge">{labelOf(PROPERTY_TYPES, item.propertyType)}</span>
            <span className="badge badge-accent">{labelOf(TRANSACTION_TYPES, item.transactionType)}</span>
            {item.isSold && <span className="badge badge-sold">거래완료</span>}
            <span style={{ flex: 1 }} />
            {item.id && <FavoriteButton propertyId={item.id} />}
          </div>

          <h1 style={{ margin: '0.25rem 0 0.2rem', fontSize: '1.45rem' }}>{item.title}</h1>
          <div className="price" style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>
            {formatPriceHuman(item.price)}
          </div>
          <p className="muted" style={{ margin: 0 }}>{item.address}</p>
          <div className="subtle" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
            조회 {views.toLocaleString()}회
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '0.85rem' }}>
        <div className="card-body">
          <dl className="spec">
            <dt>건물 유형</dt><dd>{labelOf(PROPERTY_TYPES, item.propertyType)}</dd>
            <dt>거래 유형</dt><dd>{labelOf(TRANSACTION_TYPES, item.transactionType)}</dd>
            <dt>층수</dt><dd>{item.floor}층</dd>
            <dt>전용면적</dt><dd>{item.minArea}㎡ ~ {item.maxArea}㎡</dd>
            {item.roomStructure && (<><dt>방 구조</dt><dd>{labelOf(ROOM_STRUCTURES, item.roomStructure)}</dd></>)}
            <dt>설명</dt><dd>{item.description}</dd>
          </dl>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {myUserId == null && (
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            거래하려면 로그인
          </Link>
        )}
        {myUserId != null && !isOwner && !item.isSold && (
          <button type="button" className="primary" onClick={handleRequestTransaction} disabled={busy}>
            {busy ? '요청 중…' : '거래 요청하기'}
          </button>
        )}
        {myUserId != null && isOwner && (
          <button type="button" onClick={() => navigate('/transactions/me?tab=seller')}>
            내가 받은 거래 요청 보기
          </button>
        )}
      </div>

      {action && (
        <div
          role="alert"
          className={`alert ${action.type === 'success' ? 'alert-success' : 'alert-error'}`}
          style={{ marginTop: '0.75rem' }}
        >
          {action.text}
        </div>
      )}

      {Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && (
        <NearbyPanel lat={item.latitude} lng={item.longitude} />
      )}

      <DealChart apartmentName={item.title} />

      {item.id && <ReviewSection propertyId={item.id} />}
    </section>
  );
}

export default PropertyDetailPage;
