// React Native 환경에서 @stomp/stompjs 가 요구하는 텍스트 인코더 폴리필.
// Hermes 는 TextEncoder/TextDecoder 를 노출하지 않아 stomp 패키지가 boot 시점에 throw 한다.
// 이 모듈을 import 하기만 하면 글로벌에 안전하게 주입된다.
import 'text-encoding';

import { Client, type IFrame, type IMessage } from '@stomp/stompjs';
import { API_BASE_URL } from './api';

export interface StompChatHandler {
  onMessage: (raw: unknown) => void;
  onError?: (err: string) => void;
}

/**
 * 모바일용 STOMP 클라이언트 — /ws-chat/websocket 직결 (SockJS 폴백 X).
 * 백엔드는 /ws-chat 으로 SockJS 와 raw WebSocket 모두 노출하므로 RN 에서는 raw 가 깔끔.
 *
 * roomId 의 /topic/chats.{roomId} 를 구독하고 새 메시지를 콜백으로 흘려보낸다.
 * 연결 실패 시 onError 를 호출하고 호출 측이 폴링으로 fallback 하도록 한다.
 */
export function connectChat(roomId: number, handler: StompChatHandler): () => void {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws-chat/websocket';

  let active = true;
  const client = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    onConnect: () => {
      if (!active) return;
      client.subscribe(`/topic/chats.${roomId}`, (msg: IMessage) => {
        try {
          handler.onMessage(JSON.parse(msg.body));
        } catch {
          // ignore non-JSON
        }
      });
    },
    onStompError: (frame: IFrame) => {
      handler.onError?.(frame.headers['message'] ?? 'STOMP error');
    },
    onWebSocketError: (e) => {
      handler.onError?.(String(e));
    },
  });

  try {
    client.activate();
  } catch (e) {
    handler.onError?.((e as Error).message);
  }

  return () => {
    active = false;
    try { client.deactivate(); } catch { /* ignore */ }
  };
}
