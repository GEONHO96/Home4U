import { expect, test } from '@playwright/test';
import { expectNoBlockingA11yViolations } from './fixtures/a11y';
import { injectFakeSession, mockBackend, mockChatRoom } from './fixtures/backendMock';

/**
 * 채팅방 폴링/REST fallback 흐름을 백엔드 의존 없이 검증.
 * - mockChatRoom 으로 GET /chats/{roomId}/messages 와 POST 응답 고정
 * - WebSocket(/ws-chat) 은 mock 하지 않으므로 STOMP 연결은 실패 → 폴링 fallback
 * - listMessages mock 결과의 본문이 화면에 그대로 렌더되는지 확인 + axe wcag2a/aa 위반 0건 동시 검증
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('전체 mock — 채팅방 메시지 fetch 후 본문 렌더', async ({ page, context }) => {
  await mockBackend(context); // 잡다한 호출은 빈 응답
  await mockChatRoom(context, {
    roomId: 1,
    buyerId: 2,
    sellerId: 3,
    messages: [
      { id: 11, senderId: 3, content: '안녕하세요, 매물 보러 오실래요?' },
      { id: 12, senderId: 2, content: '네 가능합니다' },
    ],
  });
  await injectFakeSession(context, { userId: 2 });

  await page.goto('/chats/1');
  // ChatRoomPage 가 listMessages 결과를 렌더 (sender.id === myUserId 인지로 좌/우 분기)
  await expect(page.getByText('안녕하세요, 매물 보러 오실래요?')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('네 가능합니다')).toBeVisible();

  await expectNoBlockingA11yViolations(page);
});

/**
 * 폴링 fallback / STOMP reconnect 후 새 메시지 도착 시뮬레이션 — 가상 시간 점프로 delayedMessages 트리거.
 *
 * 흐름: 초기 1개 메시지 렌더 → advanceTimeBy(31s) → reload → 지연된 2번째 메시지 등장.
 * wall clock 대기 없이 30+ 초 흐름 검증 — e2e 가속.
 */
test('전체 mock — 가상 시간 점프 후 지연 메시지 등장 (폴링/reconnect 시뮬레이션)', async ({ page, context }) => {
  await mockBackend(context);
  const chat = await mockChatRoom(context, {
    roomId: 1,
    buyerId: 2,
    sellerId: 3,
    messages: [
      { id: 11, senderId: 3, content: '먼저 도착한 메시지' },
    ],
    delayedMessages: [
      // 30초 후 도착 — 폴링 fallback (5초 간격) 또는 STOMP reconnect 시점에 잡힘
      { id: 12, senderId: 3, afterMs: 30_000, content: '30초 뒤 도착한 메시지' },
    ],
  });
  await injectFakeSession(context, { userId: 2 });

  await page.goto('/chats/1');
  await expect(page.getByText('먼저 도착한 메시지')).toBeVisible({ timeout: 10_000 });
  // 시점 t=0: 지연 메시지는 아직 없음
  await expect(page.getByText('30초 뒤 도착한 메시지')).toHaveCount(0);

  // 가상 시간 31초 점프 (실 wall clock 은 그대로) → reload 후 visibleMessages() 가 갱신됨
  chat.advanceTimeBy(31_000);
  await page.reload();
  await expect(page.getByText('30초 뒤 도착한 메시지')).toBeVisible({ timeout: 10_000 });

  await expectNoBlockingA11yViolations(page);
});

/**
 * delayedMessages ↔ unread-count 연동 검증 — fixture 단위 통합 테스트.
 *
 * 시나리오:
 *  - 초기: unread-count = 0
 *  - 31초 점프 → 상대방 발신 delayed 메시지 1건 도착 → unread-count = 1
 *  - markRead 호출 → unread-count = 0
 *
 * UI 가 unread 배지를 표시하지 않으므로 page.evaluate 로 fetch 직접 호출 — fixture 의 라우트 동작을
 * 행동 단위로 박제 (실 백엔드의 unread 흐름과 동등).
 */
test('mockChatRoom — delayed 메시지 도착 시 unread-count 증가, markRead 후 0', async ({ page, context }) => {
  await mockBackend(context);
  const chat = await mockChatRoom(context, {
    roomId: 1,
    buyerId: 2,
    sellerId: 3,
    delayedMessages: [
      { id: 21, senderId: 3, content: '도착할 메시지', afterMs: 30_000 },
    ],
  });
  await injectFakeSession(context, { userId: 2 });

  await page.goto('/'); // 페이지 컨텍스트 확보 — 어떤 라우트든 OK
  const fetchUnread = () => page.evaluate(async () => {
    const r = await fetch('http://localhost:8080/chats/1/unread-count?userId=2');
    return (await r.json()).count;
  });

  expect(await fetchUnread()).toBe(0);

  // 가상 시간 31초 점프 — 상대방 메시지 도착 (read 되지 않음)
  chat.advanceTimeBy(31_000);
  expect(await fetchUnread()).toBe(1);

  // markRead → 0 으로 리셋
  await page.evaluate(async () => {
    await fetch('http://localhost:8080/chats/1/read?userId=2', { method: 'POST' });
  });
  expect(await fetchUnread()).toBe(0);
});
