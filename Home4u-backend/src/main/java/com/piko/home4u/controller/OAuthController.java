package com.piko.home4u.controller;

import com.piko.home4u.dto.OAuthTokenResponse;
import com.piko.home4u.service.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class OAuthController {
    private final OAuthService oAuthService;

    // ✅ Google 로그인 API
    @GetMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestParam String code) {
        OAuthTokenResponse tokenResponse = oAuthService.googleLogin(code);
        return ResponseEntity.ok(tokenResponse);
    }

    // ✅ kakao 로그인 API
    @GetMapping("/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestParam String code) {
        OAuthTokenResponse tokenResponse = oAuthService.kakaoLogin(code);
        return ResponseEntity.ok(tokenResponse);
    }

    // ✅ Naver 로그인 API
    @GetMapping("/naver")
    public ResponseEntity<?> naverLogin(@RequestParam String code) {
        OAuthTokenResponse tokenResponse = oAuthService.naverLogin(code);
        return ResponseEntity.ok(tokenResponse);
    }
}