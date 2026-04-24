package com.piko.home4u.service;

import com.piko.home4u.dto.OAuthTokenResponse;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.UserRepository;
import com.piko.home4u.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 소셜 로그인 (Google / Kakao / Naver) 공통 플로우 구현.
 * <p>
 * 1) 프론트에서 provider 의 인증 페이지로 이동시켜 사용자가 동의 → provider 가 redirect_uri 로
 *    authorization code 를 붙여 리디렉션.
 * 2) 프론트가 `/oauth/{provider}?code=...` 로 백엔드 호출.
 * 3) 백엔드가 provider 의 token endpoint 에 client_id / client_secret / redirect_uri / code 를
 *    application/x-www-form-urlencoded 로 POST → access_token 수령.
 * 4) access_token 으로 provider 의 userinfo endpoint 호출 → email / nickname 획득.
 * 5) email 기준으로 Home4U 계정을 조회/생성 후 Home4U JWT 를 프론트에 돌려준다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OAuthService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    // --- Google ---
    @Value("${oauth.google.client-id:}")   private String googleClientId;
    @Value("${oauth.google.client-secret:}") private String googleClientSecret;
    @Value("${oauth.google.redirect-uri:}") private String googleRedirectUri;

    // --- Kakao ---
    @Value("${oauth.kakao.client-id:}")    private String kakaoClientId;
    @Value("${oauth.kakao.client-secret:}") private String kakaoClientSecret;
    @Value("${oauth.kakao.redirect-uri:}") private String kakaoRedirectUri;

    // --- Naver ---
    @Value("${oauth.naver.client-id:}")    private String naverClientId;
    @Value("${oauth.naver.client-secret:}") private String naverClientSecret;
    @Value("${oauth.naver.redirect-uri:}") private String naverRedirectUri;

    public OAuthTokenResponse googleLogin(String code) {
        requireConfigured("google", googleClientId, googleClientSecret, googleRedirectUri);
        String accessToken = exchangeCode(
                "https://oauth2.googleapis.com/token",
                googleClientId, googleClientSecret, googleRedirectUri, code);
        Map<String, Object> me = get(
                "https://www.googleapis.com/oauth2/v3/userinfo", accessToken);
        String email = (String) me.get("email");
        String name = (String) me.getOrDefault("name", email);
        return issueJwt(email, name, "google");
    }

    public OAuthTokenResponse kakaoLogin(String code) {
        requireConfigured("kakao", kakaoClientId, null, kakaoRedirectUri);
        String accessToken = exchangeCode(
                "https://kauth.kakao.com/oauth/token",
                kakaoClientId, kakaoClientSecret, kakaoRedirectUri, code);
        Map<String, Object> me = get("https://kapi.kakao.com/v2/user/me", accessToken);
        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoAccount = (Map<String, Object>) me.getOrDefault("kakao_account", Map.of());
        String email = (String) kakaoAccount.get("email");
        if (email == null) {
            // 이메일 동의 거절 시 kakao 고유 id 기반으로 유사 이메일 생성
            email = "kakao_" + me.get("id") + "@home4u.local";
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> props = (Map<String, Object>) me.getOrDefault("properties", Map.of());
        String name = (String) props.getOrDefault("nickname", email);
        return issueJwt(email, name, "kakao");
    }

    public OAuthTokenResponse naverLogin(String code) {
        requireConfigured("naver", naverClientId, naverClientSecret, naverRedirectUri);
        String accessToken = exchangeCode(
                "https://nid.naver.com/oauth2.0/token",
                naverClientId, naverClientSecret, naverRedirectUri, code);
        Map<String, Object> me = get("https://openapi.naver.com/v1/nid/me", accessToken);
        @SuppressWarnings("unchecked")
        Map<String, Object> resp = (Map<String, Object>) me.getOrDefault("response", Map.of());
        String email = (String) resp.get("email");
        String name = (String) resp.getOrDefault("name", email);
        return issueJwt(email, name, "naver");
    }

    // -------------------------------------------------------------------
    // internal helpers
    // -------------------------------------------------------------------

    private void requireConfigured(String provider, String id, String secret, String redirect) {
        if (isBlank(id) || isBlank(redirect)) {
            throw new IllegalStateException(
                    "[" + provider + "] OAuth 설정이 없습니다. 환경변수 OAUTH_" +
                            provider.toUpperCase(Locale.ROOT) + "_CLIENT_ID / _CLIENT_SECRET / _REDIRECT_URI 를 확인하세요.");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String exchangeCode(String tokenUrl, String clientId, String clientSecret,
                                String redirectUri, String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", clientId);
        if (!isBlank(clientSecret)) {
            body.add("client_secret", clientSecret);
        }
        body.add("redirect_uri", redirectUri);
        body.add("code", code);

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> res = restTemplate.exchange(
                tokenUrl, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
        Object token = res.getBody() == null ? null : res.getBody().get("access_token");
        if (token == null) {
            throw new IllegalStateException("OAuth token exchange 실패: " + res.getBody());
        }
        return token.toString();
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private Map<String, Object> get(String userInfoUrl, String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        ResponseEntity<Map> res = restTemplate.exchange(
                userInfoUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        return res.getBody() == null ? Map.of() : (Map<String, Object>) res.getBody();
    }

    private OAuthTokenResponse issueJwt(String email, String displayName, String provider) {
        if (isBlank(email)) {
            throw new IllegalStateException("[" + provider + "] 이메일을 얻지 못했습니다.");
        }
        Optional<User> existing = userRepository.findByEmail(email);
        User user = existing.orElseGet(() -> createSocialUser(email, displayName));

        String token = jwtTokenProvider.createToken(user.getUsername());
        return OAuthTokenResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .role(user.getRole().name())
                .provider(provider)
                .build();
    }

    private User createSocialUser(String email, String displayName) {
        // username 은 unique 여야 하므로 email 자체를 사용. 비밀번호는 무작위 BCrypt 로 채움
        // (소셜 로그인만 허용하려면 별도 플래그를 둘 수도 있지만, 현재 릴리스에서는 단순화)
        String randomPassword = java.util.UUID.randomUUID().toString();
        User user = new User(
                email,
                passwordEncoder.encode(randomPassword),
                email,
                "",
                UserRole.ROLE_USER
        );
        return userRepository.save(user);
    }
}
