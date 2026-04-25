import { useEffect, useRef } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import type { ChatMessage } from '../types/chat';

const WS_URL = (import.meta.env.VITE_WS_URL as string) ?? 'ws://localhost:8080/ws-chat';

/**
 * 한 채팅방의 신규 메시지를 STOMP `/topic/chats.{roomId}` 에서 구독.
 * 백엔드 서버가 가용하면 자동 재연결, 아니면 (예: dev 종료) 폴링 fallback 으로 자연스럽게 동작.
 */
export function useChatStomp(roomId: number | null, onMessage: (msg: ChatMessage) => void) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    if (!roomId) return;
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 4000,
      heartbeatIncoming: 20000,
      heartbeatOutgoing: 20000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/chats.${roomId}`, (frame: IMessage) => {
        try {
          const msg = JSON.parse(frame.body) as ChatMessage;
          cbRef.current(msg);
        } catch {
          // ignore malformed frames
        }
      });
    };

    client.onWebSocketError = () => {
      // dev 환경에서 백엔드 미가동 시 매 4초 재시도가 콘솔을 덮으므로 silently swallow.
    };

    client.activate();
    return () => {
      client.deactivate().catch(() => {});
    };
  }, [roomId]);
}
