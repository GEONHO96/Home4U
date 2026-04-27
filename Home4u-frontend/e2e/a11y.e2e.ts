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

  /**
   * 인증된 시나리오: 매물 상세 같은 로그인 후 페이지에서도 skip-link 가 동일하게 동작해야 한다.
   * REST 로 buyer 시드 + realtor 시드 + 매물 1건 보장 후 buyer 토큰을 주입하고 진입.
   */
  test('인증된 매물 상세 페이지의 skip-link 도 동일하게 main 에 포커스', async ({ page, context }) => {
    await fetch('http://localhost:8080/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a11y_buyer', password: 'pw1234', email: 'a11y_buyer@x.com', phone: '010-a11y', role: 'ROLE_USER' }),
    });
    const buyerLogin = await fetch('http://localhost:8080/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a11y_buyer', password: 'pw1234' }),
    });
    const session = await buyerLogin.json() as { token: string; userId: number; username: string; role: string };

    await fetch('http://localhost:8080/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a11y_realtor', password: 'pw1234', email: 'a11y_realtor@x.com', phone: '010-r', role: 'ROLE_REALTOR' }),
    });
    const realtorLogin = await fetch('http://localhost:8080/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'a11y_realtor', password: 'pw1234' }),
    });
    const realtor = await realtorLogin.json() as { token: string; userId: number };
    let list = (await (await fetch(`http://localhost:8080/users/${realtor.userId}/properties`, {
      headers: { Authorization: 'Bearer ' + realtor.token },
    })).json()) as { id: number }[];
    if (list.length === 0) {
      await fetch(`http://localhost:8080/properties?ownerId=${realtor.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + realtor.token },
        body: JSON.stringify({
          title: 'a11y skip-link 검증 매물', description: 'e2e', price: 30000,
          propertyType: 'APARTMENT', transactionType: 'SALE',
          address: '서울 a11y동', latitude: 37.5, longitude: 127.0,
          dong: 'a11y', gungu: 'a11y구', floor: 1, minArea: 10, maxArea: 20,
        }),
      });
      list = (await (await fetch(`http://localhost:8080/users/${realtor.userId}/properties`, {
        headers: { Authorization: 'Bearer ' + realtor.token },
      })).json()) as { id: number }[];
    }
    const propertyId = list[0].id;

    await context.addInitScript((s: typeof session) => {
      localStorage.setItem('token', s.token);
      localStorage.setItem('userId', String(s.userId));
      localStorage.setItem('username', s.username);
      localStorage.setItem('role', s.role);
    }, session);

    await page.goto(`/properties/${propertyId}`);
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
    expect(focusedText).toBe('본문으로 건너뛰기');

    await page.keyboard.press('Enter');
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(focusedId).toBe('main-content');
  });
});
