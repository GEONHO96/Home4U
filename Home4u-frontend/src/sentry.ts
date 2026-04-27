import * as Sentry from '@sentry/react';

/**
 * Sentry 초기화. VITE_SENTRY_DSN 미설정이면 silent no-op (개발/오픈소스 환경 보호).
 *
 * tracesSampleRate 는 운영 단계에서 0.1~0.2 권장.
 * production build 의 sourcemap 업로드는 별도 CI 단계 (sentry-cli) 가 담당.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENV as string | undefined) ?? import.meta.env.MODE,
    // CI 가 build 시점에 VITE_SENTRY_RELEASE=${{ github.sha }} 를 inject — sourcemap 과 자동 매칭
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE ?? 0.1),
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export { Sentry };
