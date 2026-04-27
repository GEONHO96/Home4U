// React Native 환경에서 @stomp/stompjs 가 요구하는 텍스트 인코더 폴리필.
// Hermes 는 TextEncoder/TextDecoder 를 노출하지 않아 stomp 패키지가 boot 시점에 throw 한다.
// 이 모듈을 import 하기만 하면 글로벌에 안전하게 주입된다.
import 'text-encoding';

import { Client, type IFrame, type IMessage } from '@stomp/stompjs';
import { API_BASE_URL, getSessionToken } from './api';

export interface StompChatHandler {
  onMessage: (raw: unknown) => void;
  onConnected?: () => void;
  onError?: (err: string) => void;
}

export interface StompChatHandle {
  /**
   * publish 가 가능하면 true. REST fallback 결정용.
   * 서버는 STOMP CONNECT 의 JWT 로 sender 를 식별하므로 payload 에 userId 를 포함하지 않는다.
   */
  publish(content: string): boolean;
  close(): void;
}

/**
 * 모바일용 STOMP 클라이언트 — /ws-chat/websocket 직결 (SockJS 폴백 X).
 *
 * 구독: /topic/chats.{roomId}
 * Publish: /app/chat/{roomId}/send  → ChatStompController 가 저장 + broadcast
 * 연결 실패 시 onError 가 호출되며 호출 측은 폴링/REST fallback 으로 전환할 수 있다.
 */
export function connectChat(roomId: number, handler: StompChatHandler): StompChatHandle {
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws-chat/websocket';

  let active = true;
  let connected = false;
  const token = getSessionToken();
  const client = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    // STOMP CONNECT 시 JWT 헤더 — 백엔드 StompJwtChannelInterceptor 가 검증
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    onConnect: () => {
      if (!active) return;
      connected = true;
      client.subscribe(`/topic/chats.${roomId}`, (msg: IMessage) => {
        try {
          handler.onMessage(JSON.parse(msg.body));
        } catch {
          // ignore non-JSON
        }
      });
      handler.onConnected?.();
    },
    onDisconnect: () => { connected = false; },
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

  return {
    publish(content: string): boolean {
      if (!connected) return false;
      try {
        client.publish({
          destination: `/app/chat/${roomId}/send`,
          body: JSON.stringify({ content }),
        });
        return true;
      } catch {
        return false;
      }
    },
    close() {
      active = false;
      try { client.deactivate(); } catch { /* ignore */ }
    },
  };
}
