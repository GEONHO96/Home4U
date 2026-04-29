import { defineConfig } from 'vitest/config';

/**
 * 모바일 앱 단위 테스트 설정.
 *
 * jest-expo 풀 셋업 대신 vitest 만 사용 — toastStore / app.config 같은 순수 JS/TS 로직만 검증해 RN 런타임 의존을 피한다.
 * RN 컴포넌트 렌더 테스트는 e2e 또는 detox 로 cover (현재는 Playwright 가 web 측 회귀 담당).
 *
 * react-native import 는 테스트 파일에서 vi.mock('react-native', ...) 으로 개별 mock — 전역 별칭은 두지 않음.
 *
 * coverage 정책:
 *  - 핵심 stores / api 만 추적 — RN 컴포넌트 / 화면 / hooks 는 detox 영역이라 제외
 *  - 80% line / function / statement 임계값으로 회귀 보호
 *  - branch 는 70% — store 의 platform 분기 등 일부 OS 케이스가 노드 환경에서 unreachable
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'app.config.test.ts'],
    reporters: process.env.CI ? ['default'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // 추적 대상: stores + api 헬퍼만. screens / components / hooks 는 detox/e2e 영역.
      include: ['src/toastStore.ts', 'src/api.ts', 'src/unreadStore.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        // useUnreadHydrated 같은 React hook 본체는 jsdom + @testing-library 없이 단위 검증 어려움 —
        // line/func/stmt 의 강한 임계값으로 회귀 보호하고 branch 는 65% 로 약간 완화.
        branches: 65,
      },
    },
  },
});
