package com.piko.home4u.config;

import com.piko.home4u.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * STOMP CONNECT 단계에서 Authorization 헤더의 JWT 를 검증해 SecurityContext 에 인증 정보를 심는다.
 *
 * 클라이언트는 STOMP CONNECT 프레임에 다음과 같이 헤더를 추가한다:
 *   Authorization: Bearer <JWT>
 *
 * 검증 통과 시 StompHeaderAccessor 의 user(Principal) 가 채워져 후속 publish/subscribe
 * 단계에서 SecurityContext 와 동일하게 식별 가능 (예: @MessageMapping handler 의 Principal).
 *
 * 토큰 누락 / 만료 / cross-tenant 사용자(존재하지 않음) 면 CONNECT 자체를 거부한다 — 익명 publish 차단.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;
        if (!StompCommand.CONNECT.equals(accessor.getCommand())) return message;

        String auth = accessor.getFirstNativeHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new IllegalArgumentException("STOMP CONNECT: Authorization Bearer 토큰이 필요합니다.");
        }
        String token = auth.substring(7);

        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("STOMP CONNECT: 유효하지 않은 JWT 토큰입니다.");
        }
        // getAuthentication 은 cross-tenant 토큰에 대해 JwtException 을 던진다 — 여기서는 그대로 거부 사유.
        Authentication authentication = jwtTokenProvider.getAuthentication(token);
        accessor.setUser(authentication);
        log.debug("[stomp-jwt] CONNECT user={}", authentication.getName());
        return message;
    }
}
