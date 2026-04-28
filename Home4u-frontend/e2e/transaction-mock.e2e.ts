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
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/transactions/me?tab=buyer');
  // 결제하기 버튼이 보일 때까지 대기
  const payBtn = page.getByRole('button', { name: /결제하기|결제 중/ }).first();
  await expect(payBtn).toBeVisible({ timeout: 10_000 });
  await payBtn.click();

  // 거래 상태 라벨이 "완료" 로 변하는지 (mockTransaction confirm 응답 + load() 재호출 결과)
  await expect(page.getByText('완료').first()).toBeVisible({ timeout: 10_000 });
});
