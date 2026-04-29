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
