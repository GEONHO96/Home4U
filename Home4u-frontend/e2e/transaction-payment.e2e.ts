import { expect, test } from '@playwright/test';

/**
 * 거래 → 결제 풀 흐름:
 *   1) realtor 가 매물 등록 (이미 있으면 재사용)
 *   2) buyer 가 거래 요청 (REST)
 *   3) realtor 가 거래 승인 (REST)
 *   4) buyer 의 /transactions/me 페이지에서 결제하기 버튼 클릭 → 거래 COMPLETED 확인
 *
 * confirm() 다이얼로그는 Playwright 가 자동 accept 하도록 page.on('dialog') 등록.
 */

interface Session { token: string; userId: number; username: string; role: string; }

async function login(username: string, password: string): Promise<Session> {
  const res = await fetch('http://localhost:8080/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('login failed: ' + (await res.text()));
  return (await res.json()) as Session;
}

async function ensureUser(username: string, role: 'ROLE_USER' | 'ROLE_REALTOR') {
  await fetch('http://localhost:8080/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'pw1234',
      email: `${username}@x.com`,
      phone: '010-' + username,
      role,
    }),
  });
}

async function ensureProperty(realtor: Session): Promise<number> {
  const list = (await fetch(`http://localhost:8080/users/${realtor.userId}/properties`, {
    headers: { Authorization: 'Bearer ' + realtor.token },
  }).then((r) => r.json())) as { id: number }[];
  if (list.length > 0) return list[0].id;
  const created = (await fetch(`http://localhost:8080/properties?ownerId=${realtor.userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + realtor.token },
    body: JSON.stringify({
      title: 'E2E 결제 매물',
      description: 'Payment e2e',
      price: 12345,
      propertyType: 'APARTMENT',
      transactionType: 'SALE',
      address: '서울 e2e동',
      latitude: 37.5,
      longitude: 127.0,
      dong: 'e2e',
      gungu: 'e2e구',
      floor: 1,
      minArea: 20,
      maxArea: 30,
    }),
  }).then((r) => r.json())) as { propertyId: number };
  return created.propertyId;
}

test('buyer 가 결제하기를 누르면 거래가 COMPLETED 로 전이된다', async ({ page }) => {
  await ensureUser('e2e_pay_realtor', 'ROLE_REALTOR');
  await ensureUser('e2e_pay_buyer', 'ROLE_USER');

  const realtor = await login('e2e_pay_realtor', 'pw1234');
  const buyer = await login('e2e_pay_buyer', 'pw1234');
  const propertyId = await ensureProperty(realtor);

  // 거래 요청 + 승인
  const tx = (await fetch(`http://localhost:8080/properties/${propertyId}/transactions?buyerId=${buyer.userId}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + buyer.token },
  }).then((r) => r.json())) as { id: number };

  const approveRes = await fetch(`http://localhost:8080/properties/transactions/${tx.id}/approve`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + realtor.token },
  });
  expect(approveRes.ok).toBeTruthy();

  // buyer 세션으로 transactions/me 진입 → 결제하기
  await page.addInitScript((session) => {
    localStorage.setItem('token', session.token);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('username', session.username);
    localStorage.setItem('role', session.role);
  }, buyer);

  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/transactions/me?tab=buyer');
  const payBtn = page.getByRole('button', { name: /결제하기|결제 중/ }).first();
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  // 페이지 reload 후 status 가 "완료" 로 표시
  await expect(page.getByText('완료').first()).toBeVisible({ timeout: 15_000 });
});
