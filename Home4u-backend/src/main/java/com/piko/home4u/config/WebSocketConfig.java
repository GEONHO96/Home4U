package com.piko.home4u.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket 설정.
 * - 클라이언트 연결: ws://host/ws-chat (네이티브 WebSocket — SockJS fallback 미사용)
 * - 구독 prefix: /topic/* (예: /topic/chats.{roomId})
 * - 응용 prefix: /app/* (예: /app/chat/{roomId}/send)
 * - CONNECT 단계에서 JWT 검증 (StompJwtChannelInterceptor)
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompJwtChannelInterceptor jwtChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-chat").setAllowedOriginPatterns("*");
    }

    /**
     * CONNECT 프레임의 Authorization 헤더를 JWT 로 검증.
     * 인바운드 채널 단계에 인터셉터를 등록하면 CONNECT/SUBSCRIBE/SEND 모두 통과시 user(Principal) 가 유지된다.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}
