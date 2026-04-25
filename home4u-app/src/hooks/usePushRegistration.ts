import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerPushToken } from '../api';

/**
 * 로그인 후 호출 — 디바이스의 ExpoPushToken 을 가져와 백엔드에 등록.
 * 시뮬레이터/에뮬레이터에서는 토큰을 못 받으므로 silently no-op.
 */
export function usePushRegistration(userId: number | null) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        if (!Device.isDevice) return;
        const settings = await Notifications.getPermissionsAsync();
        let granted = settings.granted;
        if (!granted) {
          const ask = await Notifications.requestPermissionsAsync();
          granted = ask.granted;
        }
        if (!granted) return;

        const projectId =
          (Notifications as unknown as { default?: unknown }).default !== undefined
            ? undefined
            : undefined;
        const tokenResp = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        const token = tokenResp.data;
        if (!cancelled && token) {
          await registerPushToken(userId, token, Platform.OS);
        }
      } catch (e) {
        // 토큰 발급 실패는 사용자에게 노출하지 않음 (네트워크/권한/시뮬레이터 등)
        // eslint-disable-next-line no-console
        console.warn('push registration skipped:', (e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}

/** 알림 표시 동작 — 앱이 포그라운드여도 배너를 띄움 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
