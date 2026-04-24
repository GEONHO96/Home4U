import { Link, Outlet, useNavigate } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.35rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Home4U
            </span>
          </Link>

          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.95rem',
            }}
          >
            <HeaderLink to="/properties">매물</HeaderLink>
            {username && <HeaderLink to="/favorites">찜</HeaderLink>}
            {username && <HeaderLink to="/saved-searches">저장된 검색</HeaderLink>}
            {username && <HeaderLink to="/transactions/me">내 거래</HeaderLink>}
            {role === 'ROLE_REALTOR' && <HeaderLink to="/properties/new">매물 등록</HeaderLink>}
            <span style={{ flex: '0 0 0.5rem' }} />
            {username ? (
              <>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    padding: '0 0.5rem',
                  }}
                >
                  {username}
                  {role === 'ROLE_REALTOR' && ' · 공인중개사'}
                </span>
                <button type="button" className="ghost" onClick={logout}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <HeaderLink to="/login">로그인</HeaderLink>
                <Link
                  to="/register"
                  style={{
                    textDecoration: 'none',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-text)',
                    color: 'var(--color-bg-elev)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1.5rem 1.25rem',
          textAlign: 'center',
          color: 'var(--color-text-subtle)',
          fontSize: '0.85rem',
          marginTop: '3rem',
        }}
      >
        Home4U · 부동산 매물 거래 플랫폼
      </footer>
    </>
  );
}

function HeaderLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-bg-muted)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
      }}
    >
      {children}
    </Link>
  );
}

export default Layout;
