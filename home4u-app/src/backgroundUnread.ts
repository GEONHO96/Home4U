import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { getSessionUserId, getUnreadCount, listChatRooms } from './api';

/**
 * 앱이 백그라운드/종료된 상태에서도 주기적으로 unread 합계를 갱신해 OS 앱 아이콘 뱃지에 반영.
 *
 * 플랫폼 한계
 *  - iOS: 시스템이 사용 패턴/배터리 상태에 따라 호출 빈도를 결정 (최소 15분 권장)
 *  - Android: 같은 정책. Doze 모드에서는 더 드물게 발화
 *
 * 등록은 로그인 후 1회 호출하면 충분 — TaskManager 가 영구 저장한다.
 */
const TASK = 'home4u-unread-sync';

TaskManager.defineTask(TASK, async () => {
  try {
    const userId = getSessionUserId();
    if (!userId) return BackgroundFetch.BackgroundFetchResult.NoData;
    const rooms = await listChatRooms(userId);
    let total = 0;
    for (const r of rooms) {
      try { total += await getUnreadCount(r.id, userId); } catch { /* ignore single room */ }
    }
    await Notifications.setBadgeCountAsync(total).catch(() => { /* permission/unsupported */ });
    return total > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/** 앱 부팅 시 한 번 호출 — 재등록은 idempotent. */
export async function registerBackgroundUnreadSync(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      return;
    }
    const tasks = await TaskManager.getRegisteredTasksAsync();
    if (tasks.some((t) => t.taskName === TASK)) return;
    await BackgroundFetch.registerTaskAsync(TASK, {
      minimumInterval: 15 * 60, // 15분
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // 시뮬레이터/개발 빌드 등 미지원 환경 — silent
  }
}
