import { expect, test } from '@playwright/test';

/**
 * 매물 찜 토글 → /favorites 에서 노출 → 해제 → 사라짐.
 * 사전 조건: backend dev 프로파일이 admin/admin1234 만 시드하므로, 테스트 user 와
 * 데모 매물을 REST 로 주입한 뒤 UI 를 검증한다.
 */
const ADMIN_USER = 'admin';
const ADMIN_PW = 'admin1234';

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch('http://localhost:8080' + url, init);
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${url} → ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function loginAs(username: string, password: string) {
  return api<{ token: string; userId: number; username: string; role: string }>('/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

test.beforeAll(async () => {
  // 데모용 buyer + realtor + 매물 1건이 없을 때만 만든다 (멱등).
  for (const u of ['e2e_buyer', 'e2e_realtor']) {
    await fetch('http://localhost:8080/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: u,
        password: 'pw1234',
        email: `${u}@x.com`,
        phone: '010-' + u,
        role: u === 'e2e_realtor' ? 'ROLE_REALTOR' : 'ROLE_USER',
      }),
    });
  }
  const realtor = await loginAs('e2e_realtor', 'pw1234');
  const existing = await api<unknown[]>(`/users/${realtor.userId}/properties`, {
    headers: { Authorization: 'Bearer ' + realtor.token },
  });
  if (existing.length === 0) {
    await fetch(`http://localhost:8080/properties?ownerId=${realtor.userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + realtor.token },
      body: JSON.stringify({
        title: 'E2E 테스트 매물',
        description: 'Playwright 테스트용',
        price: 50000,
        propertyType: 'APARTMENT',
        transactionType: 'SALE',
        address: '서울 e2e동',
        latitude: 37.5,
        longitude: 127.0,
        dong: 'e2e',
        gungu: 'e2e구',
        floor: 3,
        minArea: 30,
        maxArea: 40,
      }),
    });
  }
});

test('buyer 가 매물을 찜하면 /favorites 에 등장하고, 해제하면 사라진다', async ({ page }) => {
  const realtor = await loginAs('e2e_realtor', 'pw1234');
  // realtor 의 첫 매물 id 를 직접 알아온다 — 시드된 매물 1건.
  const list = await api<{ id: number }[]>(`/users/${realtor.userId}/properties`, {
    headers: { Authorization: 'Bearer ' + realtor.token },
  });
  const propertyId = list[0].id;

  const buyer = await loginAs('e2e_buyer', 'pw1234');
  await page.addInitScript((session) => {
    localStorage.setItem('token', session.token);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('username', session.username);
    localStorage.setItem('role', session.role);
  }, buyer);

  await page.goto(`/properties/${propertyId}`);
  // 상세 진입 후 찜하기 토글 — 페이지 내 단일 인스턴스
  const fav = page.locator('button[aria-label="찜하기"], button[aria-label="찜 해제"]').first();
  await expect(fav).toBeVisible();
  await fav.click();
  await expect(page.locator('button[aria-label="찜 해제"]')).toBeVisible();

  // /favorites 진입 후 매물 카드 노출
  await page.goto('/favorites');
  await expect(page.locator(`a[href="/properties/${propertyId}"]`).first()).toBeVisible({ timeout: 10_000 });

  // 다시 상세에서 해제
  await page.goto(`/properties/${propertyId}`);
  await page.locator('button[aria-label="찜 해제"]').click();
  await expect(page.locator('button[aria-label="찜하기"]')).toBeVisible();
});

test('admin 콘솔의 신고 탭이 빈 상태에서도 정상 렌더된다', async ({ page }) => {
  const admin = await loginAs(ADMIN_USER, ADMIN_PW);
  await page.addInitScript((session) => {
    localStorage.setItem('token', session.token);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('username', session.username);
    localStorage.setItem('role', session.role);
  }, admin);
  await page.goto('/admin?tab=reports');
  // 신고 탭이 활성화되고 테이블 헤더가 렌더되면 통과
  await expect(page.getByRole('heading', { name: '관리자 콘솔' })).toBeVisible();
  await expect(page.locator('thead th', { hasText: '대상' })).toBeVisible({ timeout: 10_000 });
});
