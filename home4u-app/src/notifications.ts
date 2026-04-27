import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { NavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../App';

/**
 * 푸시 알림 탭 → 라우팅. 백엔드의 PushService 가 보낸 data 페이로드를 파싱한다.
 *
 * 페이로드 규약 (server: PushService.sendToUser):
 *   - type: "chat"                 + roomId
 *   - type: "transaction.requested" + transactionId, propertyId
 *   - type: "transaction.approved"|"rejected" + transactionId
 *   - type: "payment.succeeded"|"receipt"      + transactionId|paymentId
 *   - type: "saved-search"          + savedSearchId
 *
 * cold-start 도 처리: 앱이 종료된 상태에서 알림 탭으로 켜진 경우 getLastNotificationResponseAsync
 * 가 한 번 결과를 돌려준다.
 */
export function useNotificationRouting(navRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>) {
  useEffect(() => {
    function route(data: Record<string, unknown> | undefined) {
      if (!data || typeof data.type !== 'string') return;
      const nav = navRef.current;
      if (!nav) return;
      switch (data.type) {
        case 'chat': {
          const roomId = Number(data.roomId);
          if (Number.isFinite(roomId)) nav.navigate('ChatRoom', { roomId });
          break;
        }
        case 'transaction.requested':
        case 'transaction.approved':
        case 'transaction.rejected':
        case 'payment.succeeded':
        case 'payment.receipt':
          nav.navigate('Transactions');
          break;
        case 'saved-search':
          nav.navigate('PropertyList');
          break;
      }
    }

    // 1) 포그라운드/백그라운드 상태에서 사용자가 탭한 경우
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      route(res.notification.request.content.data as Record<string, unknown>);
    });

    // 2) 앱이 완전히 종료된 상태에서 알림으로 켜진 경우 — 한 번만 라우팅
    Notifications.getLastNotificationResponseAsync().then((res) => {
      if (res) route(res.notification.request.content.data as Record<string, unknown>);
    });

    return () => sub.remove();
  }, [navRef]);
}
