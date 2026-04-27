import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * 핵심 페이지 a11y 검증 — axe-core 의 wcag2a + wcag2aa 규칙으로 critical/serious 위반이 없어야 한다.
 *
 * 매물 상세/관리자 콘솔처럼 인증/외부 위젯이 섞인 페이지는 false-positive 가 많아
 * 베이스 검증에서는 빠르게 처리하고, 별도 skip-link 동작 e2e 로 keyboard nav 를 검증한다.
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

  /**
   * skip-link 동작 e2e — 키보드 사용자가 Tab 한 번으로 nav 를 건너뛰고 본문에 도달할 수 있어야 한다.
   *
   * 검증 대상: 모든 인증/비인증 라우트에서 skip-link 가 첫 포커스 가능한 요소이고
   * 클릭 시 #main-content 가 활성 요소가 된다.
   */
  const SKIPLINK_PAGES = [
    { path: '/', name: 'home' },
    { path: '/properties', name: 'property-list' },
    { path: '/login', name: 'login' },
  ];

  for (const p of SKIPLINK_PAGES) {
    test(`${p.name} 의 skip-link 가 main 에 포커스를 옮긴다`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');

      // Tab 한 번 → 첫 포커스 가능 요소가 skip-link 여야 한다
      await page.keyboard.press('Tab');
      const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
      expect(focusedText).toBe('본문으로 건너뛰기');

      // skip-link 활성화 → main 영역에 포커스 이동
      await page.keyboard.press('Enter');
      const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
      expect(focusedId).toBe('main-content');
    });
  }
});
