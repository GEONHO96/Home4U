package com.piko.home4u.service;

import com.piko.home4u.model.PushToken;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.PushTokenRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Expo Push API (https://exp.host/--/api/v2/push/send) 로 알림을 발송한다.
 * 외부 키 없이도 유효한 ExpoPushToken 만 있으면 동작 — FCM 인증서가 필요한 운영 단계로 넘어갈 때
 * Expo 콘솔의 FCM Server Key 등록만 추가하면 된다.
 *
 * `home4u.push.enabled=false` (기본값) 이면 stub 으로 로그만 남기고 외부 호출은 스킵 — dev 환경 보호.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final PushTokenRepository pushTokenRepository;
    private final UserRepository userRepository;

    @Value("${home4u.push.enabled:false}")
    private boolean pushEnabled;

    /** 테스트에서 모킹할 수 있도록 protected 메서드로 추출. */
    protected RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Transactional
    public PushToken register(Long userId, String token, String platform) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("푸시 토큰이 비어있습니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return pushTokenRepository.findByToken(token)
                .map(existing -> {
                    existing.setUser(user);
                    existing.setPlatform(platform);
                    return pushTokenRepository.save(existing);
                })
                .orElseGet(() -> pushTokenRepository.save(PushToken.builder()
                        .user(user)
                        .token(token)
                        .platform(platform)
                        .build()));
    }

    @Transactional
    public void unregister(String token) {
        pushTokenRepository.deleteByToken(token);
    }

    /**
     * 유저 ID 의 모든 디바이스에 푸시. 비차단 동기화를 위해 @Async 로 호출 측 흐름을 막지 않는다.
     */
    @Async
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        List<PushToken> tokens = pushTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) return;
        for (PushToken pt : tokens) {
            sendOne(pt.getToken(), title, body, data);
        }
    }

    void sendOne(String to, String title, String body, Map<String, Object> data) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("to", to);
        payload.put("title", title);
        payload.put("body", body);
        if (data != null) payload.put("data", data);
        payload.put("sound", "default");

        if (!pushEnabled) {
            log.info("[push:stub] target={} title={} body={}", to, title, body);
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload, headers);
            restTemplate().postForEntity(EXPO_PUSH_URL, req, String.class);
        } catch (Exception ex) {
            log.warn("Expo push send failed: {} ({})", to, ex.getMessage());
        }
    }
}
