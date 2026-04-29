import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { injectFakeSession, mockBackend } from './fixtures/backendMock';

/**
 * 거래/채팅 fetch 실패 시 화면이 사용자에게 에러를 전달하는지 e2e.
 *
 * 검증 의도:
 *  - 페이지가 setError(err.message) → role="alert" 컨테이너로 렌더한다.
 *  - role="alert" 은 implicit aria-live="assertive" 라 스크린 리더가 즉시 발화 → 모바일 useToast 와 동등한 SR 경험.
 *  - **에러 상태에서도 axe-core wcag2a/aa critical/serious 위반 0건** — 에러 표시 자체가 a11y 회귀를 만들지 않도록 동시 검증.
 *
 * 백엔드 의존을 없애기 위해 mockBackend 의 catch-all 위에 specific 500 라우트를 덮어 씌운다 (Playwright 는 가장 최근에 추가된 route 가 우선).
 */
test.use({ storageState: { cookies: [], origins: [] } });

/** 에러 상태 페이지의 axe-core wcag2a/aa critical/serious 위반 0건 강제 — 에러 UI 도 a11y 보호. */
async function expectNoBlockingA11yViolations(page: Page): Promise<void> {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const blocking = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  if (blocking.length > 0) {
    for (const v of blocking) {
      // eslint-disable-next-line no-console
      console.log(`[a11y] ${v.impact} ${v.id} — ${v.help}\n  ${v.nodes[0]?.html?.slice(0, 200)}`);
    }
  }
  expect(blocking).toEqual([]);
}

test('거래 목록 fetch 실패 → role="alert" 영역에 에러 메시지 노출 + axe 위반 0건', async ({ page, context }) => {
  await mockBackend(context);
  await injectFakeSession(context, { userId: 2 });

  // catch-all 위에 더 구체적인 500 라우트를 후에 추가 — Playwright 가 매칭 시 마지막에 추가된 route 를 우선.
  await context.route('**/transactions/buyer/**', (r) => r.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'mock backend down' }),
  }));

  await page.goto('/transactions/me?tab=buyer');

  // role="alert" 컨테이너가 visible — 안에 axios 가 throw 한 메시지 또는 fallback 문구 노출.
  // axios 기본 메시지: "Request failed with status code 500"; 페이지 fallback: "거래 내역을 불러오지 못했습니다."
  const alert = page.getByRole('alert').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toHaveText(/500|실패|불러오지 못/i);

  // 에러 상태에서도 wcag a11y 회귀 없어야 함 — 색상 대비, ARIA, 헤딩 구조 등
  await expectNoBlockingA11yViolations(page);
});

test('채팅 목록 fetch 실패 → role="alert" 영역에 에러 메시지 노출 + axe 위반 0건', async ({ page, context }) => {
  await mockBackend(context);
  await injectFakeSession(context, { userId: 2 });

  // /chats?userId=* 만 500 으로 덮어씀 — 다른 mockBackend 라우트는 그대로.
  await context.route('**/chats?userId=*', (r) => r.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'mock chat list down' }),
  }));

  await page.goto('/chats');

  const alert = page.getByRole('alert').first();
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(alert).toHaveText(/500|실패|불러오/i);

  await expectNoBlockingA11yViolations(page);
});
