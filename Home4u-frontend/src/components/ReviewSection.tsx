import { useCallback, useEffect, useState } from 'react';
import {
  countReviews,
  createReview,
  deleteReview,
  getAverageRating,
  getReviewsByProperty,
} from '../api/reviewApi';
import type { Review } from '../types/review';

interface Props {
  propertyId: number;
}

function Stars({ value }: { value: number }) {
  // 정수만 사용 (리뷰 rating 은 1~5 정수). 반별은 지원하지 않음.
  const rounded = Math.round(value);
  return <span aria-label={`${value.toFixed(1)}점`}>{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>;
}

function ReviewSection({ propertyId }: Props) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const myUserIdRaw = localStorage.getItem('userId');
  const myUserId = myUserIdRaw ? Number(myUserIdRaw) : null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, average, total] = await Promise.all([
        getReviewsByProperty(propertyId),
        getAverageRating(propertyId),
        countReviews(propertyId),
      ]);
      setReviews(list);
      setAvg(Number.isFinite(average) ? average : 0);
      setCount(total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.');
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!myUserId) return;
    if (comment.trim().length === 0) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createReview({ propertyId, userId: myUserId, rating, comment });
      setComment('');
      setRating(5);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '리뷰 작성 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!myUserId) return;
    try {
      await deleteReview(reviewId, myUserId);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '리뷰 삭제 실패');
    }
  };

  return (
    <section style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
      <h3>리뷰</h3>

      <div style={{ marginBottom: '0.75rem' }}>
        {count === null ? (
          <span>로딩 중…</span>
        ) : count === 0 ? (
          <span>아직 리뷰가 없습니다.</span>
        ) : (
          <>
            <Stars value={avg ?? 0} /> <strong>{(avg ?? 0).toFixed(1)}</strong>{' '}
            <span style={{ color: '#555' }}>({count}개)</span>
          </>
        )}
      </div>

      {error && <p role="alert" style={{ color: '#c00' }}>{error}</p>}

      {myUserId ? (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 480, marginBottom: '1rem' }}>
          <label>
            별점
            <select name="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}점 — {'★'.repeat(n)}{'☆'.repeat(5 - n)}</option>
              ))}
            </select>
          </label>
          <label>
            코멘트
            <textarea
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? '등록 중…' : '리뷰 등록'}
          </button>
        </form>
      ) : (
        <p style={{ color: '#555' }}>리뷰를 작성하려면 로그인하세요.</p>
      )}

      {reviews && reviews.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {reviews.map((r) => (
            <li key={r.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Stars value={r.rating} />{' '}
                  <strong>{r.user?.username ?? `user#${r.user?.id ?? '?'}`}</strong>
                </div>
                <small style={{ color: '#777' }}>
                  {new Date(r.createdAt).toLocaleString('ko-KR')}
                </small>
              </div>
              <p style={{ margin: '0.25rem 0' }}>{r.comment}</p>
              {myUserId != null && r.user?.id === myUserId && (
                <button type="button" onClick={() => handleDelete(r.id)} style={{ fontSize: '0.85em' }}>
                  내 리뷰 삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ReviewSection;
