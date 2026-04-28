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

// ---- 채팅 / 거래 시나리오 mock ------------------------------------------------

export interface MockChatRoomOptions {
  roomId?: number;
  buyerId?: number;
  sellerId?: number;
  property?: { id: number; title: string };
  messages?: Array<{ id: number; senderId: number; content: string }>;
  unread?: number;
}

/**
 * /chats?userId · /chats/{roomId}/messages · /chats/{roomId}/unread-count · POST /chats/{roomId}/read 응답을 mock.
 */
export async function mockChatRoom(context: BrowserContext, options: MockChatRoomOptions = {}): Promise<void> {
  const roomId = options.roomId ?? 1;
  const buyer = { id: options.buyerId ?? 2, username: 'mock_buyer' };
  const seller = { id: options.sellerId ?? 3, username: 'mock_seller' };
  const property = options.property ?? { id: 9999, title: 'mock 매물' };
  const messages = (options.messages ?? []).map((m) => ({
    id: m.id,
    sender: m.senderId === buyer.id ? buyer : seller,
    content: m.content,
    createdAt: new Date().toISOString(),
    readAt: null,
  }));
  const unread = options.unread ?? 0;

  await context.route('**/chats?userId=*', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ id: roomId, buyer, seller, property, lastMessageAt: new Date().toISOString() }]),
  }));
  await context.route(`**/chats/${roomId}/messages**`, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: Date.now(), content: 'echo', sender: buyer, createdAt: new Date().toISOString() }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(messages) });
  });
  await context.route(`**/chats/${roomId}/unread-count**`, (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ count: unread }),
  }));
  await context.route(`**/chats/${roomId}/read**`, (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: '{}',
  }));
}

export interface MockTransactionOptions {
  /** 거래 목록 — 비어있으면 [] */
  transactions?: Array<{
    id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    propertyId?: number;
    propertyTitle?: string;
    price?: number;
  }>;
  /** 결제 인텐트/confirm 시 사용할 paymentId */
  paymentId?: number;
}

/**
 * /transactions/buyer/{userId} + /payments POST + /payments/{id}/confirm 응답 mock.
 * 거래→결제 e2e 의 외부 의존을 끊는다.
 */
export async function mockTransaction(context: BrowserContext, options: MockTransactionOptions = {}): Promise<void> {
  const txs = (options.transactions ?? []).map((t) => ({
    id: t.id,
    status: t.status,
    property: { id: t.propertyId ?? 9999, title: t.propertyTitle ?? 'mock 매물', price: t.price ?? 30000 },
    buyer: { id: 2, username: 'mock_buyer' },
    seller: { id: 3, username: 'mock_seller' },
    date: t.status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : null,
  }));
  const paymentId = options.paymentId ?? 11;

  await context.route('**/transactions/buyer/**', (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(txs),
  }));
  await context.route('**/transactions/seller/**', (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: '[]',
  }));
  await context.route('**/payments?transactionId=*', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ id: paymentId, amount: 30000, status: 'PENDING', providerOrderId: 'h4u-' + paymentId, transaction: txs[0] }),
  }));
  await context.route(`**/payments/${paymentId}/confirm`, (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ id: paymentId, status: 'SUCCEEDED', transaction: { ...txs[0], status: 'COMPLETED' } }),
  }));
}
