/**
 * 채팅 unread 상태를 화면 간에 공유하기 위한 가벼운 pub/sub 이벤트 버스.
 *
 * 사용 예:
 *   ChatRoomScreen 이 markRead 성공 후 unreadEvents.emit(roomId) 호출
 *   ChatListScreen 이 unreadEvents.subscribe(roomId => setUnread[roomId] = 0)
 *
 * Redux/Zustand 도입 전까지의 임시 중계 — 의존성을 추가하지 않고 즉시성만 확보.
 */
type Listener = (roomId: number) => void;

const listeners = new Set<Listener>();

export const unreadEvents = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(roomId: number): void {
    for (const fn of listeners) {
      try { fn(roomId); } catch { /* swallow */ }
    }
  },
};
