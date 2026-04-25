import { useEffect, useRef, useState } from 'react';
import { askChatbot, type ChatTurn } from '../api/chatbotApi';

const STORAGE_KEY = 'home4u-chatbot-history-v1';

function loadHistory(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatTurn[];
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch {
    return [];
  }
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('_chatbot') === '1';
  });
  const [messages, setMessages] = useState<ChatTurn[]>(loadHistory());
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)));
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 0);
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    const next: ChatTurn[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await askChatbot(next);
      setLive(res.live);
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '응답 실패';
      setMessages([...next, { role: 'assistant', content: `(오류) ${msg}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Home4U 도우미 열기"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          width: 52,
          height: 52,
          borderRadius: 26,
          background: 'var(--color-accent, #1673ff)',
          color: '#fff',
          border: 'none',
          fontSize: 22,
          boxShadow: '0 8px 18px rgba(22, 115, 255, 0.35)',
          zIndex: 50,
          cursor: 'pointer',
        }}
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Home4U 도우미"
          style={{
            position: 'fixed',
            right: 18,
            bottom: 80,
            width: 320,
            maxHeight: 460,
            background: '#fff',
            borderRadius: 14,
            border: '1px solid var(--color-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
          }}
        >
          <div style={{ padding: '0.7rem 0.85rem', borderBottom: '1px solid var(--color-border)' }}>
            <strong>Home4U 도우미</strong>
            <span className="subtle" style={{ fontSize: 11, marginLeft: 6 }}>
              {live === false ? 'stub mode' : live ? 'OpenAI' : ''}
            </span>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.7rem', background: '#f7f8fa' }}>
            {messages.length === 0 && (
              <p className="muted" style={{ fontSize: 12, lineHeight: 1.45 }}>
                안녕하세요! 매물 검색·거래·안심거래 등 무엇이든 물어보세요.
              </p>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {messages.map((m, i) => {
                const mine = m.role === 'user';
                return (
                  <li key={i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <span
                      style={{
                        maxWidth: '82%',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 12,
                        background: mine ? 'var(--color-accent, #1673ff)' : '#fff',
                        color: mine ? '#fff' : 'var(--color-text)',
                        border: mine ? 'none' : '1px solid var(--color-border)',
                        fontSize: 13,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.4,
                      }}
                    >
                      {m.content}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={send} style={{ display: 'flex', gap: 6, padding: '0.55rem 0.6rem', borderTop: '1px solid var(--color-border)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요"
              disabled={busy}
              style={{ flex: 1, fontSize: 13 }}
            />
            <button type="submit" className="primary" disabled={busy || !input.trim()} style={{ fontSize: 13, padding: '0.35rem 0.7rem' }}>
              {busy ? '…' : '전송'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
