package com.piko.home4u.controller;

import com.piko.home4u.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * STOMP 기반 채팅 publish 엔드포인트.
 * 클라이언트가 /app/chat/{roomId}/send 로 메시지를 publish 하면 ChatService 가
 * 저장 + /topic/chats.{roomId} 로 broadcast 한다 — REST 한 번 더 호출하는 round-trip 절약.
 *
 * STOMP CONNECT 시 인증 정보(헤더의 Authorization)는 별도 인터셉터가 필요해
 * 현재는 payload 의 userId 를 신뢰하는 형태 — 운영 단계에서는 SecurityContext 연동 필요.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatService chatService;

    @MessageMapping("/chat/{roomId}/send")
    public void send(@DestinationVariable Long roomId, @Payload Map<String, Object> body) {
        Object rawUser = body.get("userId");
        Object rawContent = body.get("content");
        if (rawUser == null || rawContent == null) {
            log.warn("[chat-stomp] missing userId/content for room={}", roomId);
            return;
        }
        long userId;
        try {
            userId = Long.parseLong(String.valueOf(rawUser));
        } catch (NumberFormatException ex) {
            log.warn("[chat-stomp] invalid userId={}", rawUser);
            return;
        }
        String content = String.valueOf(rawContent);
        chatService.sendMessage(roomId, userId, content);
        // sendMessage 가 SimpMessagingTemplate 으로 자동 broadcast 하므로 추가 작업 불필요.
    }
}
