import type { BrowserContext } from '@playwright/test';

/**
 * 다른 e2e 가 백엔드 의존 없이 화면을 검증할 수 있도록 공유하는 mock 라우트.
 *
 * 사용 예:
 *   import { mockBackend, injectFakeSession } from './fixtures/backendMock';
 *   await mockBackend(context, { propertyId: 9999 });
 *   await injectFakeSession(context);
 *   await page.goto('/properties/9999');
 *
 * 모든 백엔드 호출은 빈 응답으로 통과시켜 Layout / 라우터의 행동만 격리해서 검증한다.
 */

export interface MockBackendOptions {
  propertyId?: number;
  property?: Record<string, unknown>;
  /** /properties/{id} 에 대한 응답 status. 기본 200 + property body. 404 로 두면 PropertyDetailPage 가 에러 메시지 렌더 (Layout 은 마운트). */
  propertyStatus?: number;
}

const DEFAULT_PROPERTY = {
  id: 9999,
  title: 'mock 매물',
  description: 'e2e fixture',
  price: 30000,
  address: '서울 mock동',
  latitude: 37.5,
  longitude: 127.0,
  propertyType: 'APARTMENT',
  transactionType: 'SALE',
  floor: 1,
  minArea: 10,
  maxArea: 20,
  dong: 'mock',
  gungu: 'mock구',
  isSold: false,
  views: 0,
  ownerId: 1,
  imageUrls: [],
};

/**
 * 모든 localhost:8080 요청을 가로챈다.
 *  - /properties/{id}: 옵션에 따라 200(property body) 또는 404
 *  - 그 외 (reviews, favorites, registry, realtor-stats, subway, schools, apt-deals): 빈 [] 응답
 */
export async function mockBackend(context: BrowserContext, options: MockBackendOptions = {}): Promise<void> {
  const propertyId = options.propertyId ?? DEFAULT_PROPERTY.id;
  const propertyStatus = options.propertyStatus ?? 200;
  const property = options.property ?? { ...DEFAULT_PROPERTY, id: propertyId };

  await context.route('**/localhost:8080/**', async (route) => {
    const url = route.request().url();
    if (url.endsWith(`/properties/${propertyId}`)) {
      return route.fulfill({
        status: propertyStatus,
        contentType: 'application/json',
        body: propertyStatus === 200
          ? JSON.stringify(property)
          : JSON.stringify({ message: 'mocked not found' }),
      });
    }
    if (url.includes('/realtor-stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 1, username: 'mockowner', role: 'ROLE_REALTOR',
          propertyCount: 1, totalReviews: 0, averageRating: null,
          totalFavorites: 0, totalTransactions: 0, completionRate: null, medianResponseMinutes: null,
        }),
      });
    }
    if (url.includes('/registry/properties/')) {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ propertyId, address: 'mock', liens: 0, seizures: 0, clean: true, notes: [], source: 'stub' }),
      });
    }
    if (url.includes('/favorites/check')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"favorited":false}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}

/**
 * 가짜 buyer 세션을 localStorage 에 주입. mockBackend 와 짝지어 쓴다.
 */
export async function injectFakeSession(
  context: BrowserContext,
  session: { token?: string; userId?: number; username?: string; role?: string } = {},
): Promise<void> {
  const s = {
    token: session.token ?? 'mock-jwt',
    userId: session.userId ?? 2,
    username: session.username ?? 'mock_buyer',
    role: session.role ?? 'ROLE_USER',
  };
  await context.addInitScript((session) => {
    localStorage.setItem('token', session.token);
    localStorage.setItem('userId', String(session.userId));
    localStorage.setItem('username', session.username);
    localStorage.setItem('role', session.role);
  }, s);
}
