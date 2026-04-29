import { defineConfig } from 'vitest/config';

/**
 * 모바일 앱 단위 테스트 설정.
 *
 * jest-expo 풀 셋업 대신 vitest 만 사용 — toastStore / app.config 같은 순수 JS/TS 로직만 검증해 RN 런타임 의존을 피한다.
 * RN 컴포넌트 렌더 테스트는 e2e 또는 detox 로 cover (현재는 Playwright 가 web 측 회귀 담당).
 *
 * react-native import 는 테스트 파일에서 vi.mock('react-native', ...) 으로 개별 mock — 전역 별칭은 두지 않음.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'app.config.test.ts'],
    // CI 에서 detail 한 실패 정보 보이도록
    reporters: process.env.CI ? ['default'] : ['default'],
  },
});
