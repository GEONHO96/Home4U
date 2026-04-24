package com.piko.home4u.controller;

import com.piko.home4u.dto.OAuthTokenResponse;
import com.piko.home4u.service.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OAuthController {
    private final OAuthService oAuthService;

    // 필드 기본값은 빈 문자열. @Value 가 property 로 덮어쓴다.
    // (MockMvc standalone 컨텍스트는 @Value 를 적용하지 않으므로 기본값이 NPE 를 막아준다.)

    // --- Google ---
    @Value("${oauth.google.client-id:}")   private String googleClientId = "";
    @Value("${oauth.google.redirect-uri:}") private String googleRedirectUri = "";

    // --- Kakao ---
    @Value("${oauth.kakao.client-id:}")    private String kakaoClientId = "";
    @Value("${oauth.kakao.redirect-uri:}") private String kakaoRedirectUri = "";

    // --- Naver ---
    @Value("${oauth.naver.client-id:}")    private String naverClientId = "";
    @Value("${oauth.naver.redirect-uri:}") private String naverRedirectUri = "";

    /**
     * 프론트가 "소셜 로그인" 버튼을 눌렀을 때 받아갈 provider authorization URL.
     * 설정이 없으면 {@code configured: false} 를 돌려주어 프론트가 "미설정" 배너를 노출할 수 있게 한다.
     */
    @GetMapping("/{provider}/authorize-url")
    public ResponseEntity<Map<String, Object>> authorizeUrl(@PathVariable String provider) {
        String url;
        boolean configured;
        switch (provider) {
            case "google" -> {
                configured = !googleClientId.isBlank() && !googleRedirectUri.isBlank();
                url = configured ? UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                        .queryParam("client_id", googleClientId)
                        .queryParam("redirect_uri", googleRedirectUri)
                        .queryParam("response_type", "code")
                        .queryParam("scope", "openid email profile")
                        .build().toUriString()
                        : null;
            }
            case "kakao" -> {
                configured = !kakaoClientId.isBlank() && !kakaoRedirectUri.isBlank();
                url = configured ? UriComponentsBuilder.fromUriString("https://kauth.kakao.com/oauth/authorize")
                        .queryParam("client_id", kakaoClientId)
                        .queryParam("redirect_uri", kakaoRedirectUri)
                        .queryParam("response_type", "code")
                        .build().toUriString()
                        : null;
            }
            case "naver" -> {
                configured = !naverClientId.isBlank() && !naverRedirectUri.isBlank();
                url = configured ? UriComponentsBuilder.fromUriString("https://nid.naver.com/oauth2.0/authorize")
                        .queryParam("client_id", naverClientId)
                        .queryParam("redirect_uri", naverRedirectUri)
                        .queryParam("response_type", "code")
                        .queryParam("state", UUID.randomUUID().toString())
                        .build().toUriString()
                        : null;
            }
            default -> {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "unknown provider: " + provider));
            }
        }
        return ResponseEntity.ok(Map.of(
                "provider", provider,
                "configured", configured,
                "url", url == null ? "" : url
        ));
    }

    @GetMapping("/google")
    public ResponseEntity<OAuthTokenResponse> googleLogin(@RequestParam String code) {
        return ResponseEntity.ok(oAuthService.googleLogin(code));
    }

    @GetMapping("/kakao")
    public ResponseEntity<OAuthTokenResponse> kakaoLogin(@RequestParam String code) {
        return ResponseEntity.ok(oAuthService.kakaoLogin(code));
    }

    @GetMapping("/naver")
    public ResponseEntity<OAuthTokenResponse> naverLogin(@RequestParam String code) {
        return ResponseEntity.ok(oAuthService.naverLogin(code));
    }
}
