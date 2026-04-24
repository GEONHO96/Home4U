import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyChatRooms } from '../api/chatApi';
import type { ChatRoom } from '../types/chat';

export default function ChatListPage() {
  const userIdRaw = localStorage.getItem('userId');
  const userId = userIdRaw ? Number(userIdRaw) : null;
  const username = localStorage.getItem('username');
  const [rooms, setRooms] = useState<ChatRoom[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    listMyChatRooms(userId)
      .then(setRooms)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '불러오기 실패');
        setRooms([]);
      });
  }, [userId]);

  if (!userId) {
    return (
      <section className="container-narrow" style={{ padding: '2.5rem 1.25rem' }}>
        <h1>채팅</h1>
        <div className="alert alert-error" role="alert">로그인이 필요합니다.</div>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>채팅</h1>
      <p className="muted" style={{ marginBottom: '1.1rem' }}>
        매물 문의 및 거래 커뮤니케이션을 한 곳에서 관리하세요.
      </p>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {rooms === null ? (
        <p className="muted">불러오는 중…</p>
      ) : rooms.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          아직 진행 중인 채팅이 없습니다. 매물 상세에서 "채팅 문의"를 시작해보세요.
        </div></div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem' }}>
          {rooms.map((r) => {
            const other = r.buyer?.username === username ? r.seller : r.buyer;
            return (
              <li key={r.id}>
                <Link to={`/chats/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <article className="card">
                    <div className="card-body" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div
                        aria-hidden
                        style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--color-accent-soft)',
                          color: 'var(--color-accent-hover)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1rem',
                        }}
                      >
                        {(other?.username ?? '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong>{other?.username ?? '알 수 없음'}</strong>
                          {r.property && (
                            <span className="badge">{r.property.title}</span>
                          )}
                        </div>
                        <div className="subtle" style={{ fontSize: '0.8rem' }}>
                          최근: {new Date(r.lastMessageAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
