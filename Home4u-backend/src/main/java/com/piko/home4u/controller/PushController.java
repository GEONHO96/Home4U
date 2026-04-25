package com.piko.home4u.controller;

import com.piko.home4u.model.PushToken;
import com.piko.home4u.service.PushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/push")
@RequiredArgsConstructor
public class PushController {

    private final PushService pushService;

    /** 디바이스 등록. body: {token, platform}, query: userId */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestParam Long userId,
                                                        @RequestBody Map<String, String> body) {
        String token = body.getOrDefault("token", "").trim();
        String platform = body.getOrDefault("platform", "");
        PushToken saved = pushService.register(userId, token, platform);
        return ResponseEntity.ok(Map.of(
                "tokenId", saved.getId(),
                "platform", saved.getPlatform() == null ? "" : saved.getPlatform(),
                "message", "푸시 토큰 등록 완료"));
    }

    @DeleteMapping("/register")
    public ResponseEntity<Map<String, Object>> unregister(@RequestParam String token) {
        pushService.unregister(token);
        return ResponseEntity.ok(Map.of("message", "푸시 토큰 해지 완료"));
    }
}
