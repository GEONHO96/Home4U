import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * 채팅 unread 상태 전역 store + AsyncStorage 영속.
 *
 * - byRoom: 방별 미읽음 수
 * - setMany: 여러 방의 카운트를 한 번에 갱신 (ChatList 의 폴링/BG fetch 결과 반영)
 * - markRead: 한 방을 0 으로 — ChatRoom 진입/메시지 도착 시
 * - total: 모든 방 합계 — OS 앱 아이콘 뱃지 카운트로 사용
 *
 * persist middleware:
 *   - AsyncStorage 에 byRoom 만 직렬화 — 함수는 제외
 *   - 앱 재시작 시 초기 마운트에 마지막 카운트가 즉시 표시되어 첫 화면 깜빡임 제거
 *   - rehydrate 직후에도 OS 뱃지 동기화
 *
 * useUnreadHydrated() 훅:
 *   - persist hydration 이 끝나기 전에는 false 를 반환
 *   - ChatList 의 setInterval / BG fetch / setMany 는 이 값이 true 가 된 뒤에 실행해
 *     stale 0 으로 깜빡이는 것을 막는다.
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

export const useUnread = create<UnreadState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'home4u-unread-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ byRoom: state.byRoom }) as Pick<UnreadState, 'byRoom'>,
      onRehydrateStorage: () => (state) => {
        if (state?.byRoom) syncBadge(state.byRoom);
      },
    },
  ),
);

export function useUnreadHydrated(): boolean {
  const [hydrated, setHydrated] = useState<boolean>(() => useUnread.persist.hasHydrated());
  useEffect(() => {
    if (useUnread.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsubFinish = useUnread.persist.onFinishHydration(() => setHydrated(true));
    return () => { unsubFinish(); };
  }, []);
  return hydrated;
}
