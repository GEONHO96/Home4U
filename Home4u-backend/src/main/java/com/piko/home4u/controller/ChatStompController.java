package com.piko.home4u.controller;

import com.piko.home4u.service.ChatService;
import com.piko.home4u.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
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
 *
 * 예외 처리:
 *   ChatService.sendMessage 가 throw 하면 (예: room 미참여, 빈 메시지, 차단된 사용자)
 *   @MessageExceptionHandler 가 잡아 발신자 큐 (/user/queue/chat-errors) 로 에러 프레임을 돌려준다.
 *   클라이언트는 이 큐를 구독해 사용자에게 토스트로 보여주면 된다.
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
            throw new IllegalStateException("STOMP CONNECT 인증 정보가 없습니다.");
        }
        Object rawContent = body == null ? null : body.get("content");
        if (rawContent == null) {
            throw new IllegalArgumentException("content 가 비어 있습니다.");
        }
        var sender = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new IllegalStateException(
                        "사용자(" + principal.getName() + ")를 찾을 수 없습니다."));
        chatService.sendMessage(roomId, sender.getId(), String.valueOf(rawContent));
        // sendMessage 가 SimpMessagingTemplate 으로 자동 broadcast 하므로 추가 작업 불필요.
    }

    /**
     * @MessageMapping 안에서 던져진 예외를 잡아 발신자에게 에러 정보를 돌려준다.
     * Spring 의 user destination 변환으로 /user/queue/chat-errors 는
     * 실제로는 /queue/chat-errors-user{sessionId} 로 라우팅된다.
     * 클라이언트는 client.subscribe('/user/queue/chat-errors', ...) 로 받는다.
     */
    @MessageExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class, RuntimeException.class })
    @SendToUser(destinations = "/queue/chat-errors", broadcast = false)
    public Map<String, Object> handleSendException(Throwable ex, Principal principal) {
        String user = principal != null ? principal.getName() : "<anonymous>";
        log.warn("[chat-stomp] error for user={}: {}", user, ex.getMessage());
        return Map.of(
                "type", "chat.error",
                "message", ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
    }
}
