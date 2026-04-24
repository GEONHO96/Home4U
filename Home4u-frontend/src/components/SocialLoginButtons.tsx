import { useEffect, useState, type ReactNode } from 'react';
import { getAuthorizeUrl, type OAuthProvider } from '../api/oauthApi';

const PROVIDERS: { id: OAuthProvider; label: string; bg: string; fg: string; border?: string; logo: ReactNode }[] = [
  {
    id: 'google',
    label: 'Google 계정으로 계속',
    bg: '#ffffff',
    fg: '#1f1f1f',
    border: '#dadce0',
    logo: (
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
    ),
  },
  {
    id: 'kakao',
    label: '카카오로 계속',
    bg: '#FEE500',
    fg: '#191919',
    logo: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#191919">
        <path d="M12 3C6.48 3 2 6.58 2 10.98c0 2.85 1.85 5.35 4.64 6.82L5.4 21.6c-.1.33.27.59.56.42l4.38-2.9c.54.06 1.1.1 1.66.1 5.52 0 10-3.58 10-7.98C22 6.58 17.52 3 12 3z"/>
      </svg>
    ),
  },
  {
    id: 'naver',
    label: '네이버로 계속',
    bg: '#03C75A',
    fg: '#ffffff',
    logo: (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="#ffffff">
        <path d="M9.77 8.89L6.13 3.67H3.12v8.66h3.11V7.1l3.64 5.23h3.01V3.67H9.77v5.22z"/>
      </svg>
    ),
  },
];

function SocialLoginButtons() {
  // provider 별 configured 여부만 저장. URL 은 클릭 시 새로 조회 (state/nonce 를 매번 신선하게).
  const [status, setStatus] = useState<Record<OAuthProvider, boolean | null>>({
    google: null,
    kakao: null,
    naver: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        (['google', 'kakao', 'naver'] as const).map(async (p) => {
          try {
            const res = await getAuthorizeUrl(p);
            return [p, res.configured] as const;
          } catch {
            return [p, false] as const;
          }
        }),
      );
      if (cancelled) return;
      const next = { ...status };
      for (const [p, ok] of results) next[p] = ok;
      setStatus(next);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async (provider: OAuthProvider) => {
    try {
      const res = await getAuthorizeUrl(provider);
      if (!res.configured || !res.url) {
        alert(`${provider} 소셜 로그인이 아직 서버에 설정되지 않았습니다.\n(OAUTH_${provider.toUpperCase()}_CLIENT_ID / _CLIENT_SECRET / _REDIRECT_URI)`);
        return;
      }
      window.location.href = res.url;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '소셜 로그인 시작 실패');
    }
  };

  const anyConfigured = Object.values(status).some((v) => v);

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {PROVIDERS.map((p) => {
        const configured = status[p.id];
        const disabled = configured === false;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => handleClick(p.id)}
            disabled={disabled}
            title={disabled ? '서버에 client_id/secret 미설정' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              background: p.bg,
              color: p.fg,
              border: p.border ? `1px solid ${p.border}` : `1px solid ${p.bg}`,
              fontWeight: 500,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              opacity: disabled ? 0.55 : 1,
            }}
          >
            {p.logo}
            <span>{p.label}</span>
          </button>
        );
      })}

      {anyConfigured === false && (
        <p className="subtle" style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', textAlign: 'center' }}>
          소셜 로그인 provider 설정이 아직 비어 있습니다. README 의 "소셜 로그인 설정" 참고.
        </p>
      )}
    </div>
  );
}

export default SocialLoginButtons;
