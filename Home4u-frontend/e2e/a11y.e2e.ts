import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 핵심 페이지 a11y 검증 — axe-core 의 wcag2a + wcag2aa 규칙으로 critical/serious 위반이 없어야 한다.
 *
 * 알려진 외부 컴포넌트(예: react-leaflet 의 div role 누락) 는 false-positive 가 많으므로
 * 매물 지도 페이지는 별도로 다루지 않고, 로그인/홈/매물 상세 같은 자체 마크업 화면만 검증.
 *
 * 새 위반이 생기면 실패해 PR 리뷰 단계에서 캡처한다 — minor/moderate 는 허용해 자잘한 노이즈를 막음.
 */

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
];

test.describe('a11y · WCAG 2.0 A/AA', () => {
  // 다른 e2e 가 남긴 token/role 등의 storage 가 헤더 nav 를 바꿔 a11y 결과를 흔드는 것 방지 — 빈 storageState 강제
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const p of PAGES) {
    test(`${p.name} (${p.path}) 페이지가 critical/serious 위반이 없어야 한다`, async ({ page }) => {
      await page.goto(p.path);
      // 페이지 마운트 대기
      await page.waitForLoadState('networkidle');

      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const blocking = result.violations.filter((v) =>
        v.impact === 'critical' || v.impact === 'serious',
      );
      if (blocking.length > 0) {
        // 디버깅용 — Playwright 출력에 위반 룰 + 첫 노드만 노출
        for (const v of blocking) {
          // eslint-disable-next-line no-console
          console.log(`[a11y] ${v.impact} ${v.id} — ${v.help}\n  ${v.nodes[0]?.html?.slice(0, 200)}`);
        }
      }
      expect(blocking).toEqual([]);
    });
  }
});
