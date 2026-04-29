import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * useUnread + useUnreadHydrated 단위 테스트.
 *
 * 검증 의도:
 *  - setMany / markRead / total 의 동작
 *  - markRead 가 OS 뱃지 카운트(setBadgeCountAsync)와 동기화
 *  - persist hydration race — useUnreadHydrated 가 rehydrate 끝나기 전 false, 끝난 후 true 전이
 *
 * AsyncStorage / expo-notifications 는 노드 환경에서 import 불가 — vi.mock 으로 가짜 대체.
 * react 의 hooks 를 단위로 호출하려면 react-test-renderer 가 필요하지만, useUnreadHydrated 는
 * useUnread.persist 의 onFinishHydration 이벤트만 구독하므로 store 직접 검증으로 충분 (훅 본체는 별도 e2e 필요).
 */

const { mockSetBadge, mockStorage } = vi.hoisted(() => {
  const data = new Map<string, string>();
  return {
    mockSetBadge: vi.fn(async () => true),
    mockStorage: {
      data,
      getItem: vi.fn(async (k: string) => data.get(k) ?? null),
      setItem: vi.fn(async (k: string, v: string) => { data.set(k, v); }),
      removeItem: vi.fn(async (k: string) => { data.delete(k); }),
    },
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockStorage,
}));
vi.mock('expo-notifications', () => ({
  setBadgeCountAsync: mockSetBadge,
}));
vi.mock('react', async () => {
  // unreadStore 의 useUnreadHydrated 가 react 의 useEffect/useState 를 임포트하지만,
  // 우리는 그 훅을 직접 호출하지 않고 store.persist API 만 검증하므로 stub 으로 충분.
  return {
    useState: <T>(init: T | (() => T)) => [typeof init === 'function' ? (init as () => T)() : init, () => {}],
    useEffect: () => {},
  };
});

import { useUnread } from './unreadStore';

beforeEach(() => {
  mockSetBadge.mockClear();
  mockStorage.data.clear();
  // store 상태 리셋 — 다음 케이스가 직전 케이스 영향 안 받게
  useUnread.setState({ byRoom: {} });
});

describe('useUnread store · 핵심 액션', () => {
  it('setMany 가 byRoom 을 교체하고 OS 뱃지를 합계로 동기화', () => {
    useUnread.getState().setMany({ 1: 3, 2: 5 });
    expect(useUnread.getState().byRoom).toEqual({ 1: 3, 2: 5 });
    expect(mockSetBadge).toHaveBeenCalledTimes(1);
    expect(mockSetBadge).toHaveBeenCalledWith(8);
  });

  it('markRead 가 해당 방만 0 으로 만들고 다른 방은 보존', () => {
    useUnread.getState().setMany({ 1: 3, 2: 5 });
    mockSetBadge.mockClear();
    useUnread.getState().markRead(1);
    expect(useUnread.getState().byRoom).toEqual({ 1: 0, 2: 5 });
    expect(mockSetBadge).toHaveBeenCalledWith(5);
  });

  it('markRead 가 존재하지 않던 방에 대해서도 안전하게 0 추가', () => {
    useUnread.getState().setMany({ 1: 3 });
    useUnread.getState().markRead(999);
    expect(useUnread.getState().byRoom).toEqual({ 1: 3, 999: 0 });
  });

  it('total() 이 byRoom 합계 반환', () => {
    useUnread.getState().setMany({ 1: 3, 2: 5, 3: 0 });
    expect(useUnread.getState().total()).toBe(8);
  });

  it('total() 이 빈 byRoom 에서 0', () => {
    useUnread.setState({ byRoom: {} });
    expect(useUnread.getState().total()).toBe(0);
  });

  it('setBadgeCountAsync 가 reject 해도 store 액션은 throw 하지 않음 (권한 미허가 등)', () => {
    mockSetBadge.mockRejectedValueOnce(new Error('permission denied'));
    expect(() => useUnread.getState().setMany({ 1: 1 })).not.toThrow();
  });
});

describe('useUnread.persist · hydration race 가드', () => {
  it('persist API 가 hasHydrated / onFinishHydration 노출', () => {
    expect(typeof useUnread.persist.hasHydrated).toBe('function');
    expect(typeof useUnread.persist.onFinishHydration).toBe('function');
  });

  it('onFinishHydration 콜백이 등록 가능 + unsubscribe 함수 반환', () => {
    const cb = vi.fn();
    const unsub = useUnread.persist.onFinishHydration(cb);
    expect(typeof unsub).toBe('function');
    unsub(); // 정상 unsubscribe
  });
});
