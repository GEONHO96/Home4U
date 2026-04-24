import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { exchangeOAuthCode, type OAuthProvider } from '../api/oauthApi';

function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!provider || !code) {
      setError('인증 코드가 URL 에 없습니다. 다시 로그인을 시도해주세요.');
      return;
    }
    if (provider !== 'google' && provider !== 'kakao' && provider !== 'naver') {
      setError(`지원하지 않는 provider: ${provider}`);
      return;
    }

    (async () => {
      try {
        const res = await exchangeOAuthCode(provider as OAuthProvider, code);
        localStorage.setItem('token', res.token);
        localStorage.setItem('userId', String(res.userId));
        localStorage.setItem('username', res.username);
        localStorage.setItem('role', res.role);
        navigate('/properties', { replace: true });
      } catch (err: unknown) {
        const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
        setError(
          anyErr.response?.data?.message ??
            anyErr.message ??
            '소셜 로그인 중 오류가 발생했습니다.',
        );
      }
    })();
  }, [provider, navigate]);

  return (
    <section className="container-narrow" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '0.4rem' }}>
        {provider ? `${provider} 로그인 처리 중…` : '소셜 로그인'}
      </h2>
      {error ? (
        <div className="alert alert-error" role="alert" style={{ maxWidth: 420, margin: '1rem auto' }}>
          {error}
        </div>
      ) : (
        <p className="muted">잠시만 기다려주세요.</p>
      )}
    </section>
  );
}

export default OAuthCallbackPage;
