import { create } from 'zustand';
import * as Notifications from 'expo-notifications';

/**
 * 채팅 unread 상태 전역 store.
 *
 * - byRoom: 방별 미읽음 수
 * - setMany: 여러 방의 카운트를 한 번에 갱신 (ChatList 의 폴링/BG fetch 결과 반영)
 * - markRead: 한 방을 0 으로 — ChatRoom 진입/메시지 도착 시
 * - total: 모든 방 합계 — OS 앱 아이콘 뱃지 카운트로 사용
 *
 * 어디서나 useUnread() 로 구독하면 Provider 없이 컴포넌트 트리 전반에 전파된다.
 * 변경 시마다 OS 뱃지를 자동 동기화 (권한 미허용 / 미지원 시 silent).
 */
interface UnreadState {
  byRoom: Record<number, number>;
  setMany: (entries: Record<number, number>) => void;
  markRead: (roomId: number) => void;
  total: () => number;
}

function syncBadge(map: Record<number, number>) {
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  Notifications.setBadgeCountAsync(total).catch(() => { /* permission/unsupported */ });
}

export const useUnread = create<UnreadState>((set, get) => ({
  byRoom: {},
  setMany: (entries) => {
    set({ byRoom: entries });
    syncBadge(entries);
  },
  markRead: (roomId) => {
    const next = { ...get().byRoom, [roomId]: 0 };
    set({ byRoom: next });
    syncBadge(next);
  },
  total: () => Object.values(get().byRoom).reduce((a, b) => a + b, 0),
}));
