import { useEffect, useState } from 'react';
import { getRealtorStats, type RealtorStats } from '../api/statsApi';

interface Props {
  userId: number;
}

function formatRating(avg: number | null, reviews: number): string {
  if (avg == null || reviews === 0) return '신규';
  return `★ ${avg.toFixed(1)}`;
}

function formatCompletion(rate: number | null): string {
  if (rate == null) return '거래 이력 없음';
  return `${Math.round(rate * 100)}%`;
}

function formatResponse(minutes: number | null): string {
  if (minutes == null) return '데이터 없음';
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `약 ${hours}시간`;
  const days = Math.round(hours / 24);
  return `약 ${days}일`;
}

function roleLabel(role: string): string {
  if (role === 'ROLE_REALTOR') return '공인중개사';
  if (role === 'ROLE_ADMIN') return '관리자';
  return '일반 사용자';
}

function RealtorCard({ userId }: Props) {
  const [stats, setStats] = useState<RealtorStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRealtorStats(userId)
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message ?? '등록자 정보를 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <div className="card" style={{ marginTop: '0.85rem' }}>
        <div className="card-body">
          <div className="muted" style={{ fontSize: '0.85rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card" style={{ marginTop: '0.85rem' }}>
        <div className="card-body">
          <div className="muted" style={{ fontSize: '0.85rem' }}>등록자 정보 불러오는 중…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: '0.85rem' }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>등록자 정보</h3>
          <span className="badge">{roleLabel(stats.role)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div
            aria-hidden
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {stats.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{stats.username}</div>
            <div className="subtle" style={{ fontSize: '0.8rem' }}>
              {formatRating(stats.averageRating, stats.totalReviews)}
              {stats.totalReviews > 0 && ` · 리뷰 ${stats.totalReviews}건`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.5rem',
            textAlign: 'center',
          }}
        >
          <StatCell label="등록 매물" value={`${stats.propertyCount}건`} />
          <StatCell label="누적 찜" value={`${stats.totalFavorites}`} />
          <StatCell label="거래 완료율" value={formatCompletion(stats.completionRate)} />
          <StatCell label="응답 속도" value={formatResponse(stats.medianResponseMinutes)} />
        </div>

      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--color-surface-alt, #f5f7fb)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '0.5rem 0.35rem',
      }}
    >
      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{value}</div>
      <div className="subtle" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>{label}</div>
    </div>
  );
}

export default RealtorCard;
