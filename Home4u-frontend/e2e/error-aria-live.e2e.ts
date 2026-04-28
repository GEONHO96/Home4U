import { expect, test } from '@playwright/test';
import { injectFakeSession, mockBackend } from './fixtures/backendMock';

/**
 * 거래/채팅 fetch 실패 시 화면이 사용자에게 에러를 전달하는지 e2e.
 *
 * 검증 의도:
 *  - 페이지가 setError(err.message) → role="alert" 컨테이너로 렌더한다.
 *  - role="alert" 은 implicit aria-live="assertive" 라 스크린 리더가 즉시 발화 → 모바일 useToast 와 동등한 SR 경험.
 *
 * axe-core 의 wcag a11y 검증과는 별개 — 여긴 "에러 발생 시 실제로 SR 영역에 메시지가 들어가는가"를 행동 단위로 캡처한다.
 *
 * 백엔드 의존을 없애기 위해 mockBackend 의 catch-all 위에 specific 500 라우트를 덮어 씌운다 (Playwright 는 가장 최근에 추가된 route 가 우선).
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('거래 목록 fetch 실패 → role="alert" 영역에 에러 메시지 노출', async ({ page, context }) => {
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
});

test('채팅 목록 fetch 실패 → role="alert" 영역에 에러 메시지 노출', async ({ page, context }) => {
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
});
