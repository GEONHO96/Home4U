import { expect, test } from '@playwright/test';
import { injectFakeSession, mockBackend, mockTransaction } from './fixtures/backendMock';

/**
 * 거래 → 결제 confirm 흐름을 백엔드 의존 없이 검증.
 * - mockTransaction 으로 buyer 의 APPROVED 거래 1건을 고정 노출
 * - 결제하기 클릭 → window.confirm 다이얼로그 자동 accept → confirm API 가 COMPLETED 반환
 * - UI 가 거래 상태 라벨을 "완료" 로 갱신하는지 확인
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('전체 mock — 거래 결제하기 → COMPLETED 라벨 전이', async ({ page, context }) => {
  await mockBackend(context); // 그 외 호출은 빈 응답
  await mockTransaction(context, {
    transactions: [
      { id: 1, status: 'APPROVED', propertyId: 9999, propertyTitle: 'mock 매물', price: 30000 },
    ],
    paymentId: 11,
  });
  await injectFakeSession(context);

  // window.confirm 자동 accept (결제 진행 동의 모달)
  // dialog 가 race 로 이미 닫힌 경우 accept() 가 throw 할 수 있어 swallow.
  page.on('dialog', (dialog) => { dialog.accept().catch(() => { /* already dismissed */ }); });

  await page.goto('/transactions/me?tab=buyer');
  // 결제하기 버튼이 보일 때까지 대기
  const payBtn = page.getByRole('button', { name: /결제하기|결제 중/ }).first();
  await expect(payBtn).toBeVisible({ timeout: 10_000 });
  await payBtn.click();

  // 거래 상태 라벨이 "완료" 로 변하는지 (mockTransaction confirm 응답 + load() 재호출 결과)
  await expect(page.getByText('완료').first()).toBeVisible({ timeout: 10_000 });
});

/**
 * 판매자 시점 거래 거절 (REJECT) 흐름 — PENDING 거래에 대해 거절 버튼 클릭 시
 * mockTransaction 의 state machine 이 status 를 REJECTED 로 전이시키고 UI 라벨이 갱신된다.
 *
 * "buyer 가 본인 PENDING 요청을 cancel" 도 백엔드 단에서는 동일한 reject 엔드포인트를 호출하므로
 * 같은 mock 으로 cancel 흐름까지 커버한다.
 */
test('전체 mock — 판매자 PENDING 거래 거절 → REJECTED 라벨 전이', async ({ page, context }) => {
  await mockBackend(context);
  await mockTransaction(context, {
    view: 'seller',
    transactions: [
      { id: 7, status: 'PENDING', propertyId: 9999, propertyTitle: 'mock 매물', price: 30000 },
    ],
  });
  // 판매자 세션 — REALTOR 권한
  await injectFakeSession(context, { userId: 3, username: 'mock_seller', role: 'ROLE_REALTOR' });

  await page.goto('/transactions/me?tab=seller');
  const rejectBtn = page.getByRole('button', { name: '거절' }).first();
  await expect(rejectBtn).toBeVisible({ timeout: 10_000 });
  await rejectBtn.click();

  // 전이 후: 거절/승인 버튼은 사라지고 (PENDING 조건이 false) badge 가 "거절" 로 표시됨
  await expect(page.getByRole('button', { name: '거절' })).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.badge-sold').filter({ hasText: '거절' })).toBeVisible();
});
