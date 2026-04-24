import { Link } from 'react-router-dom';

function HomePage() {
  const username = localStorage.getItem('username');
  return (
    <section className="container" style={{ padding: '4rem 1.25rem 3rem' }}>
      <div style={{ maxWidth: 720 }}>
        <span
          className="badge badge-accent"
          style={{ marginBottom: '1.1rem', letterSpacing: '0.02em' }}
        >
          Home4U · 부동산 매물 거래
        </span>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', lineHeight: 1.1 }}>
          매물 등록부터 거래 승인까지,<br />
          한 흐름에서 끝냅니다.
        </h1>
        <p
          className="muted"
          style={{ fontSize: '1.05rem', maxWidth: 580, marginTop: '0.5rem' }}
        >
          공인중개사는 매물을 올리고 들어온 거래를 관리합니다. 구매자는 지역·거래 유형·면적·층수로
          필터링하고 원클릭으로 거래를 요청합니다. 거래가 승인되면 매물은 자동으로 거래완료로
          전환되고, 리뷰로 다음 사용자를 돕습니다.
        </p>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.6rem', flexWrap: 'wrap' }}>
          <Link
            to="/properties"
            style={{
              textDecoration: 'none',
              padding: '0.7rem 1.2rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-text)',
              color: 'var(--color-bg-elev)',
              fontWeight: 500,
            }}
          >
            매물 둘러보기 →
          </Link>
          {!username && (
            <Link
              to="/register"
              style={{
                textDecoration: 'none',
                padding: '0.7rem 1.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-strong)',
                color: 'var(--color-text)',
                fontWeight: 500,
              }}
            >
              회원가입
            </Link>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '3.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <FeatureCard
          title="매물 탐색"
          body="지역 프리셋과 거래 유형, 면적, 층수, 방 구조로 원하는 매물만 빠르게 좁힙니다."
        />
        <FeatureCard
          title="원클릭 거래"
          body="로그인 후 상세 페이지에서 단일 버튼으로 거래를 요청. 승인되면 [거래완료]로 자동 전환됩니다."
        />
        <FeatureCard
          title="리뷰 기반 신뢰"
          body="별점과 코멘트로 매물 후기를 남기고 확인할 수 있습니다. 본인 리뷰만 삭제 가능."
        />
      </div>
    </section>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: '0.35rem', fontSize: '1.05rem' }}>{title}</h3>
      <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
        {body}
      </p>
    </div>
  );
}

export default HomePage;
