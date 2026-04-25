import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listMessages, markRead, sendMessage } from '../api/chatApi';
import { useChatStomp } from '../hooks/useChatStomp';
import type { ChatMessage } from '../types/chat';

export default function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const roomIdNum = roomId ? Number(roomId) : null;
  const userIdRaw = localStorage.getItem('userId');
  const myUserId = userIdRaw ? Number(userIdRaw) : null;
  const myUsername = localStorage.getItem('username');

  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!roomIdNum || !myUserId) return;
    try {
      const list = await listMessages(roomIdNum, myUserId);
      setMessages(list);
      // 스크롤 끝으로
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }, 0);
      // 읽음 처리
      markRead(roomIdNum, myUserId).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로드 실패');
      setMessages([]);
    }
  }, [roomIdNum, myUserId]);

  useEffect(() => { load(); }, [load]);

  // STOMP 구독 — 신규 메시지 도착 시 list 에 추가 (중복 방지: id 기준)
  useChatStomp(roomIdNum, (incoming) => {
    setMessages((prev) => {
      if (!prev) return [incoming];
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, 0);
    if (roomIdNum && myUserId && incoming.sender?.id !== myUserId) {
      markRead(roomIdNum, myUserId).catch(() => {});
    }
  });

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomIdNum || !myUserId) return;
    const content = input.trim();
    if (!content) return;
    setSending(true);
    try {
      const saved = await sendMessage(roomIdNum, myUserId, content);
      setInput('');
      // 송신자에게도 STOMP 가 echo 되지만, 즉시성을 위해 낙관적 추가 (id 기준 중복 방지)
      setMessages((prev) => {
        if (!prev) return [saved];
        if (prev.some((m) => m.id === saved.id)) return prev;
        return [...prev, saved];
      });
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }, 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '전송 실패');
    } finally {
      setSending(false);
    }
  };

  if (!myUserId) {
    return (
      <section className="container-narrow" style={{ padding: '2.5rem 1.25rem' }}>
        <div className="alert alert-error" role="alert">로그인이 필요합니다.</div>
        <Link to="/login">로그인 페이지로</Link>
      </section>
    );
  }

  return (
    <section className="container-narrow" style={{ padding: '1rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-h))' }}>
      <Link to="/chats" className="muted" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>← 채팅 목록</Link>
      <h2 style={{ margin: '0.5rem 0 0.75rem', fontSize: '1.15rem' }}>대화</h2>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--color-bg-soft)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem',
          border: '1px solid var(--color-border)',
        }}
      >
        {messages === null ? (
          <p className="muted">불러오는 중…</p>
        ) : messages.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center' }}>첫 메시지를 보내보세요.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.35rem' }}>
            {messages.map((m) => {
              const isMine = m.sender?.username === myUsername;
              return (
                <li
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '14px',
                      background: isMine ? 'var(--color-accent)' : '#fff',
                      color: isMine ? '#fff' : 'var(--color-text)',
                      border: isMine ? 'none' : '1px solid var(--color-border)',
                      fontSize: '0.92rem',
                      lineHeight: 1.35,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content}
                  </div>
                  <small style={{ color: 'var(--color-text-subtle)', fontSize: '0.72rem', marginTop: 2 }}>
                    {isMine ? '' : `${m.sender?.username ?? '상대'} · `}
                    {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form onSubmit={onSend} style={{ marginTop: '0.65rem', display: 'flex', gap: '0.4rem' }}>
        <input
          name="content"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{ flex: 1 }}
          disabled={sending}
        />
        <button type="submit" className="primary" disabled={sending || !input.trim()}>
          {sending ? '전송 중…' : '전송'}
        </button>
      </form>
    </section>
  );
}
