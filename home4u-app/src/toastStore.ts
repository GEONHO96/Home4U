import { create } from 'zustand';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * 화면 전반에서 공통으로 띄우는 토스트 store.
 *
 * 사용:
 *   const showToast = useToast((s) => s.show);
 *   showToast({ tone: 'error', message: '전송 실패' });
 *
 * - tone: 'info' | 'success' | 'error'
 * - 자동 dismiss: 표시 후 ms (기본 3000) 가 지나면 자동 사라짐
 * - 단일 토스트 슬롯 — 새 show 가 오면 기존 토스트는 즉시 교체 (대기열 없음)
 *
 * UI 컴포넌트 (<GlobalToast />) 가 이 store 를 구독해 화면 상단에 fade-in/out 으로 렌더한다.
 */

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastEntry {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastState {
  current: ToastEntry | null;
  show: (input: { tone?: ToastTone; message: string; durationMs?: number }) => void;
  dismiss: () => void;
}

let seq = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  current: null,
  show: ({ tone = 'info', message, durationMs = 3000 }) => {
    seq += 1;
    const entry: ToastEntry = { id: seq, tone, message };
    if (timer) clearTimeout(timer);
    set({ current: entry });
    // a11y: VoiceOver / TalkBack 가 즉시 메시지를 읽도록 — accessibilityLiveRegion 의 화면 리렌더 타이밍에
    // 의존하지 않고 OS 큐로 직접 전달. error 톤은 prefix 로 맥락 추가.
    if (Platform.OS !== 'web') {
      const spoken = (tone === 'error' ? '오류: ' : tone === 'success' ? '완료: ' : '') + message;
      try { AccessibilityInfo.announceForAccessibility(spoken); } catch { /* noop */ }
    }
    timer = setTimeout(() => {
      // 자동 dismiss — 다른 show 가 사이에 끼면 id 가 다르므로 함부로 끄지 않음
      set((state) => (state.current?.id === entry.id ? { current: null } : state));
      timer = null;
    }, durationMs);
  },
  dismiss: () => {
    if (timer) { clearTimeout(timer); timer = null; }
    set({ current: null });
  },
}));
