import { expect, test } from '@playwright/test';

/**
 * 스모크 e2e — 단일 시나리오: admin 로그인 → 관리자 콘솔 → 차트/탭 확인 + 챗봇 stub 호출 확인.
 *
 * 데모 계정: admin / admin1234 (DataSeeder 가 dev 프로파일에서 시드).
 * Backend webServer 옵션이 시작 시 한 번 띄우면 같은 H2 인메모리 인스턴스를 공유한다.
 */
test('홈 화면이 로드되고 핵심 네비게이션이 보인다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Home4U/);
  await expect(page.getByRole('link', { name: '매물', exact: true })).toBeVisible();
  // 우하단 챗봇 FAB
  await expect(page.getByRole('button', { name: 'Home4U 도우미 열기' })).toBeVisible();
});

test('admin 로그인 후 관리자 콘솔 요약 + 차트가 렌더된다', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin1234');
  await page.getByRole('button', { name: /^로그인$|^로그인 중/ }).click();

  // 헤더에 "관리자" 링크가 노출되어야 함
  await expect(page.getByRole('link', { name: '관리자' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('link', { name: '관리자' }).click();

  await expect(page.getByRole('heading', { name: '관리자 콘솔' })).toBeVisible();
  // 요약 카드 + recharts 가 1개 이상 렌더 (line/bar/pie 중 svg 가 보임)
  await expect(page.getByText('사용자 Role 분포')).toBeVisible();
  await expect(page.locator('svg.recharts-surface').first()).toBeVisible({ timeout: 10_000 });
});

test('Home4U 도우미 챗봇이 stub 모드로 응답한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Home4U 도우미 열기' }).click();
  const dialog = page.getByRole('dialog', { name: 'Home4U 도우미' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('질문을 입력하세요').fill('안심거래는 어떻게 진행돼?');
  await dialog.getByRole('button', { name: /^전송|^…/ }).click();
  // assistant 응답이 등장 (stub 모드 키워드 매칭)
  await expect(dialog.getByText(/등기|배지|안심/)).toBeVisible({ timeout: 15_000 });
});
