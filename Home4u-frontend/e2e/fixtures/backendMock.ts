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
  /**
   * 가상 시간이 afterMs 이상 경과했을 때 메시지 목록에 추가되는 지연 메시지.
   * controller.advanceTimeBy 로 시간을 점프하면 다음 fetch 가 갱신된 목록을 반환 — 폴링 fallback /
   * STOMP reconnect 후 도착한 새 메시지 시뮬레이션에 사용.
   */
  delayedMessages?: Array<{ id: number; senderId: number; content: string; afterMs: number }>;
}

/**
 * mockChatRoom 이 반환하는 controller — 가상 시간 점프로 delayedMessages 트리거 + unread 변경 시뮬레이션.
 */
export interface MockChatRoomController {
  /** 가상 시간을 ms 만큼 진행. delayedMessages 의 afterMs 가 통과하면 다음 fetch 응답에 포함된다. */
  advanceTimeBy(ms: number): void;
  /** 디버깅용 — 현재 가상 now (epoch ms). */
  now(): number;
  /** unread-count 응답을 동적으로 변경 (예: BG fetch 사이 새 메시지 도착 시뮬레이션). */
  setUnread(count: number): void;
}

/**
 * /chats?userId · /chats/{roomId}/messages · /chats/{roomId}/unread-count · POST /chats/{roomId}/read 응답을 mock.
 *
 * 시간 추상화: mockTransaction 과 동일한 advanceTimeBy 패턴 — wall clock 대기 없이
 * polling fallback / 지연 메시지 도착 흐름을 가속해 검증.
 */
export async function mockChatRoom(context: BrowserContext, options: MockChatRoomOptions = {}): Promise<MockChatRoomController> {
  const roomId = options.roomId ?? 1;
  const buyer = { id: options.buyerId ?? 2, username: 'mock_buyer' };
  const seller = { id: options.sellerId ?? 3, username: 'mock_seller' };
  const property = options.property ?? { id: 9999, title: 'mock 매물' };
  // baseStartMs — 가상 시간의 origin. delayedMessages 의 afterMs 는 이 origin 기준 상대 시각.
  const baseStartMs = Date.now();
  let virtualOffsetMs = 0;
  const now = (): number => Date.now() + virtualOffsetMs;

  const messages = (options.messages ?? []).map((m) => ({
    id: m.id,
    sender: m.senderId === buyer.id ? buyer : seller,
    content: m.content,
    createdAt: new Date(baseStartMs).toISOString(),
    readAt: null as string | null,
  }));
  const delayed = (options.delayedMessages ?? []).map((m) => ({
    id: m.id,
    sender: m.senderId === buyer.id ? buyer : seller,
    senderId: m.senderId,
    content: m.content,
    afterMs: m.afterMs,
  }));
  let baseUnread = options.unread ?? 0;
  // 마지막 read 시점 (baseStartMs 기준 ms). markRead 호출 시 갱신 — 이 시점 이후의 delayedMessages 만 unread 로 카운트.
  let lastReadElapsedMs = -1;

  // 가상 시간 기준으로 baseStartMs + afterMs 이 통과한 delayedMessages 만 visible
  const elapsedNow = () => now() - baseStartMs;
  const visibleMessages = () => {
    const elapsed = elapsedNow();
    const extras = delayed
      .filter((d) => elapsed >= d.afterMs)
      .map((d) => ({
        id: d.id,
        sender: d.sender,
        content: d.content,
        createdAt: new Date(baseStartMs + d.afterMs).toISOString(),
        readAt: lastReadElapsedMs >= d.afterMs ? new Date(baseStartMs + lastReadElapsedMs).toISOString() : null,
      }));
    return [...messages, ...extras];
  };
  // 도착했지만 아직 read 되지 않은 (상대방 발신) delayedMessages 카운트 — base unread 와 합산해 응답.
  const computeUnread = () => {
    const elapsed = elapsedNow();
    const arrivedFromOther = delayed.filter((d) => elapsed >= d.afterMs && d.senderId !== buyer.id && d.afterMs > lastReadElapsedMs).length;
    return baseUnread + arrivedFromOther;
  };

  await context.route('**/chats?userId=*', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify([{ id: roomId, buyer, seller, property, lastMessageAt: new Date(now()).toISOString() }]),
  }));
  await context.route(`**/chats/${roomId}/messages**`, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: now(), content: 'echo', sender: buyer, createdAt: new Date(now()).toISOString() }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(visibleMessages()) });
  });
  await context.route(`**/chats/${roomId}/unread-count**`, (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ count: computeUnread() }),
  }));
  await context.route(`**/chats/${roomId}/read**`, (r) => {
    // markRead 시점에 elapsed 시간을 기록 — 이전 delayedMessages 는 모두 read 처리됨
    lastReadElapsedMs = elapsedNow();
    baseUnread = 0;
    return r.fulfill({
      status: 200, contentType: 'application/json', body: '{"updated":1}',
    });
  });

  return {
    advanceTimeBy(ms: number): void {
      virtualOffsetMs += ms;
    },
    now,
    setUnread(count: number): void {
      baseUnread = count;
    },
  };
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
  /** 거래 목록을 반환할 역할 view. 기본 'buyer' (기존 동작 유지). 'both' 는 buyer/seller 양쪽 모두 동일 state 반환. */
  view?: 'buyer' | 'seller' | 'both';
  /**
   * REJECTED 거래가 archive 되어 목록에서 사라지기까지의 ms.
   * 실제 백엔드에서는 일정 기간 후 admin sweep job 이 archive — 그 동작을 모사한다.
   * 미설정/0 이면 archive 하지 않음 (기존 동작 유지).
   */
  archiveRejectedAfterMs?: number;
}

/**
 * mockTransaction 이 반환하는 controller — 가상 시간을 즉시 advance 해 archive sweep 같은 시간 의존
 * 시나리오를 실제 setTimeout 없이 검증하는 데 사용.
 *
 * 사용:
 *   const tx = await mockTransaction(context, { archiveRejectedAfterMs: 1000 });
 *   // ... reject 클릭 후
 *   tx.advanceTimeBy(1500);  // 가상 시간 1.5초 진행 — 실 wall clock 은 변하지 않음
 *   await page.reload();      // 다음 fetch 가 archive 된 결과 반환
 */
export interface MockTransactionController {
  /** 가상 now() 를 ms 만큼 앞으로 진행. archive sweep 같은 시간 의존 흐름의 e2e 가속용. */
  advanceTimeBy(ms: number): void;
  /** 디버깅용 — 현재 가상 now (epoch ms). */
  now(): number;
}

/**
 * /transactions/buyer · /transactions/seller · /properties/transactions/*\/approve · /reject ·
 * /payments · /payments/{id}/confirm 응답 mock.
 *
 * 상태 머신 (백엔드 동작과 동등):
 *  - approve 호출 → 해당 거래 PENDING → APPROVED
 *  - reject  호출 → 해당 거래 PENDING → REJECTED
 *  - confirm 호출 → APPROVED → COMPLETED (date 도 오늘로 세팅)
 * 후속 /transactions/{role}/{userId} 호출이 갱신된 state 를 반환해 UI 라벨이 자연스럽게 전이된다.
 *
 * 시간 추상화: 내부에서 Date.now() 대신 클로저 now() (real wall clock + advanceTimeBy 누적) 사용.
 * advanceTimeBy 로 가상 시간을 점프하면 archive sweep 검증이 실시간 wait 없이 즉시 가능.
 */
export async function mockTransaction(context: BrowserContext, options: MockTransactionOptions = {}): Promise<MockTransactionController> {
  const view = options.view ?? 'buyer';
  const archiveAfterMs = options.archiveRejectedAfterMs ?? 0;
  // 가상 시간 — wall clock + advanceTimeBy 누적분. 테스트가 시간을 앞당길 때만 사용.
  let virtualOffsetMs = 0;
  const now = (): number => Date.now() + virtualOffsetMs;
  interface TxRow {
    id: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    property: { id: number; title: string; price: number };
    buyer: { id: number; username: string };
    seller: { id: number; username: string };
    date: string | null;
    rejectedAt?: number;
  }
  const state: TxRow[] = (options.transactions ?? []).map((t) => ({
    id: t.id,
    status: t.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
    property: { id: t.propertyId ?? 9999, title: t.propertyTitle ?? 'mock 매물', price: t.price ?? 30000 },
    buyer: { id: 2, username: 'mock_buyer' },
    seller: { id: 3, username: 'mock_seller' },
    date: t.status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : null,
  }));
  const paymentId = options.paymentId ?? 11;
  let confirmedTxId: number | null = null;

  // archive sweep — REJECTED 거래가 일정 기간 후 admin job 으로 archive 되는 백엔드 동작 모사.
  // 매 조회 시점에 lazy 로 필터링 — 별도 setInterval/timer 없이 동작 (Playwright 의 route handler 가
  // 노드 프로세스에서 동기 실행되므로 간결).
  const visibleState = (): TxRow[] => {
    if (archiveAfterMs <= 0) return state;
    const t = now();
    return state.filter((row) => !(row.status === 'REJECTED' && row.rejectedAt != null && t - row.rejectedAt >= archiveAfterMs));
  };

  // role view — buyer / seller / both 에 따라 어느 엔드포인트가 state 를 반환할지 결정
  await context.route('**/transactions/buyer/**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(view === 'buyer' || view === 'both' ? visibleState() : []),
  }));
  await context.route('**/transactions/seller/**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(view === 'seller' || view === 'both' ? visibleState() : []),
  }));

  // 판매자: PENDING → APPROVED 전이
  await context.route('**/properties/transactions/*/approve', (r) => {
    const m = /\/transactions\/(\d+)\/approve/.exec(r.request().url());
    if (m) {
      const tx = state.find((t) => t.id === Number(m[1]));
      if (tx && tx.status === 'PENDING') tx.status = 'APPROVED';
    }
    return r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ message: 'approved' }),
    });
  });
  // 판매자: PENDING → REJECTED 전이 (구매자 시점에서는 본인 요청 cancel 와 동등)
  await context.route('**/properties/transactions/*/reject', (r) => {
    const m = /\/transactions\/(\d+)\/reject/.exec(r.request().url());
    if (m) {
      const tx = state.find((t) => t.id === Number(m[1]));
      if (tx && tx.status === 'PENDING') {
        tx.status = 'REJECTED';
        tx.rejectedAt = now();
      }
    }
    return r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ message: 'rejected' }),
    });
  });

  await context.route('**/payments?transactionId=*', (r) => {
    const url = r.request().url();
    const m = /transactionId=(\d+)/.exec(url);
    confirmedTxId = m ? Number(m[1]) : state[0]?.id ?? null;
    return r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: paymentId, amount: 30000, status: 'PENDING', providerOrderId: 'h4u-' + paymentId, transaction: state.find((t) => t.id === confirmedTxId) ?? state[0] }),
    });
  });
  await context.route(`**/payments/${paymentId}/confirm`, (r) => {
    // 결제 confirm → 해당 거래의 status 를 COMPLETED 로 전이 (다음 /transactions/buyer 조회가 갱신됨)
    if (confirmedTxId != null) {
      const tx = state.find((t) => t.id === confirmedTxId);
      if (tx) {
        tx.status = 'COMPLETED';
        tx.date = new Date().toISOString().slice(0, 10);
      }
    }
    return r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: paymentId, status: 'SUCCEEDED', transaction: state.find((t) => t.id === confirmedTxId) }),
    });
  });

  return {
    advanceTimeBy(ms: number): void {
      virtualOffsetMs += ms;
    },
    now,
  };
}
