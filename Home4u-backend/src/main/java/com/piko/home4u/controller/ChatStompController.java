package com.piko.home4u.controller;

import com.piko.home4u.service.ChatService;
import com.piko.home4u.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * STOMP 기반 채팅 publish 엔드포인트.
 *
 * 흐름:
 *   1) StompJwtChannelInterceptor 가 CONNECT 단계에서 JWT 를 검증하고 StompHeaderAccessor.user 를 설정
 *   2) Spring 이 @MessageMapping 핸들러에 java.security.Principal 인자로 동일 객체를 주입
 *   3) Principal.getName() = JWT 의 username → UserService.getUserByUsername 으로 신뢰 가능한 userId 획득
 *
 * payload 의 userId 는 더 이상 신뢰하지 않는다 — 클라이언트가 위조해도 실제 발신자는 토큰 소유자로 강제됨.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatService chatService;
    private final UserService userService;

    @MessageMapping("/chat/{roomId}/send")
    public void send(@DestinationVariable Long roomId,
                     @Payload Map<String, Object> body,
                     Principal principal) {
        if (principal == null || principal.getName() == null) {
            log.warn("[chat-stomp] unauthenticated CONNECT — refused (room={})", roomId);
            return;
        }
        Object rawContent = body == null ? null : body.get("content");
        if (rawContent == null) {
            log.warn("[chat-stomp] missing content for room={} user={}", roomId, principal.getName());
            return;
        }
        var sender = userService.getUserByUsername(principal.getName())
                .orElse(null);
        if (sender == null || sender.getId() == null) {
            log.warn("[chat-stomp] sender lookup miss — username={}", principal.getName());
            return;
        }
        chatService.sendMessage(roomId, sender.getId(), String.valueOf(rawContent));
        // sendMessage 가 SimpMessagingTemplate 으로 자동 broadcast 하므로 추가 작업 불필요.
    }
}
