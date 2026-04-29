import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * useToast 의 announceForAccessibility 디바운스 가드 단위 테스트.
 *
 * 검증 의도:
 *  - 같은 spoken 문구가 1500ms 이내 재호출되면 announceForAccessibility 는 1번만 발화 (시각 토스트는 그대로)
 *  - 1500ms 이후라면 같은 문구라도 다시 발화
 *  - tone 이 다르면 prefix 가 달라져 별개 spoken 으로 취급 (디바운스 적용 X)
 *  - Platform.OS === 'web' 인 경우 OS announce 를 호출하지 않음 (시각 토스트만 갱신)
 *
 * react-native 는 노드 환경에서 import 불가 — vi.mock 으로 Platform / AccessibilityInfo 를 가짜로 대체.
 */

// vi.mock 은 hoisting 되어 import 보다 먼저 실행됨 — 변수 캡처는 vi.hoisted 로 처리
const { mockAnnounce, mockPlatform } = vi.hoisted(() => ({
  mockAnnounce: vi.fn(),
  mockPlatform: { OS: 'ios' as 'ios' | 'android' | 'web' },
}));

vi.mock('react-native', () => ({
  Platform: mockPlatform,
  AccessibilityInfo: {
    announceForAccessibility: mockAnnounce,
  },
}));

import { useToast, __resetToastAnnounceForTests } from './toastStore';

describe('useToast announce 디바운스 가드', () => {
  beforeEach(() => {
    __resetToastAnnounceForTests();
    mockAnnounce.mockReset();
    mockPlatform.OS = 'ios';
    useToast.getState().dismiss();
    vi.useRealTimers();
  });

  it('같은 spoken 문구가 1500ms 이내 재호출되면 OS announce 를 1번만 한다', () => {
    const show = useToast.getState().show;
    show({ tone: 'error', message: '결제 실패' });
    show({ tone: 'error', message: '결제 실패' });
    show({ tone: 'error', message: '결제 실패' });
    expect(mockAnnounce).toHaveBeenCalledTimes(1);
    expect(mockAnnounce).toHaveBeenCalledWith('오류: 결제 실패');
  });

  it('1500ms 이후라면 동일 문구라도 다시 발화한다', () => {
    vi.useFakeTimers({ now: 0 });
    const show = useToast.getState().show;
    show({ tone: 'error', message: '결제 실패' });
    vi.setSystemTime(1600);
    show({ tone: 'error', message: '결제 실패' });
    expect(mockAnnounce).toHaveBeenCalledTimes(2);
  });

  it('tone 이 달라 prefix 가 달라지면 별개 spoken — 디바운스 적용되지 않는다', () => {
    const show = useToast.getState().show;
    show({ tone: 'error', message: '같은 메시지' });
    show({ tone: 'success', message: '같은 메시지' });
    expect(mockAnnounce).toHaveBeenCalledTimes(2);
    expect(mockAnnounce).toHaveBeenNthCalledWith(1, '오류: 같은 메시지');
    expect(mockAnnounce).toHaveBeenNthCalledWith(2, '완료: 같은 메시지');
  });

  it('Platform.OS === web 이면 announceForAccessibility 호출하지 않는다 (시각 토스트만)', () => {
    mockPlatform.OS = 'web';
    const show = useToast.getState().show;
    show({ tone: 'info', message: '웹 환경' });
    expect(mockAnnounce).not.toHaveBeenCalled();
    // 시각 토스트는 그대로 갱신
    expect(useToast.getState().current?.message).toBe('웹 환경');
  });
});
