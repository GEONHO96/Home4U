import type { Page } from '@playwright/test';

/**
 * 가상 시간을 Node 측 mock 컨트롤러 + 브라우저 측 Playwright clock 양쪽에 동시에 진행.
 *
 * 문제: mockTransaction / mockChatRoom 의 advanceTimeBy 는 Node 프로세스의 가상 offset 만 변경 →
 * Playwright route handler 의 응답 시점은 가속되지만, 페이지 안의 setInterval / setTimeout
 * (예: ChatRoom 의 5초 폴링 fallback) 은 wall clock 에 맞춰 동작해 검증이 느려짐.
 *
 * 해결: 두 시간을 동기화 — 한 번 호출로 양쪽 모두 advance.
 *
 * 사용:
 *   import { installVirtualClock, advanceTime } from './fixtures/time';
 *   await installVirtualClock(page);            // 페이지 측 Date.now / timers freeze
 *   const tx = await mockTransaction(context, ...);
 *   const chat = await mockChatRoom(context, ...);
 *   // ... 시간 점프
 *   await advanceTime(page, [tx, chat], 30_000);   // Node 측 + 브라우저 측 timer 가속
 *
 * 주의:
 *  - installVirtualClock 은 page.goto 이전에 호출 (timers 가 install 시점부터만 frozen)
 *  - clock 미설치 시 advanceTime 은 silent 하게 Node 측만 진행 (graceful degradation)
 */

export interface TimeController {
  advanceTimeBy(ms: number): void;
}

/**
 * 페이지의 Date / setTimeout / setInterval 을 fake clock 으로 install + pause.
 * page.goto 이전에 호출 — install 시점 이후 자동 ticking 없이 fastForward 호출에만 advance.
 */
export async function installVirtualClock(page: Page, options: { time?: number } = {}): Promise<void> {
  const time = options.time ?? Date.now();
  await page.clock.install({ time });
  // pauseAt 으로 자동 tick 정지 — install 만으로는 wall clock 흐름 그대로
  await page.clock.pauseAt(time);
}

/**
 * Node 측 controller 들 + 페이지 측 clock 을 동시에 ms 만큼 앞당김.
 * controllers 는 mockTransaction / mockChatRoom 의 반환값을 그대로 전달.
 *
 * page.clock 이 install 되어있지 않으면 fastForward 호출은 무시 (catch) — Node 측만 advance.
 */
export async function advanceTime(
  page: Page,
  controllers: TimeController[],
  ms: number,
): Promise<void> {
  for (const c of controllers) c.advanceTimeBy(ms);
  try {
    await page.clock.fastForward(ms);
  } catch {
    // clock 미설치 — Node 측만 진행 (graceful degradation)
  }
}
