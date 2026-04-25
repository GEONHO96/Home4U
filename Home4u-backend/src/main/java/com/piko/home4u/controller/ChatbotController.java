package com.piko.home4u.controller;

import com.piko.home4u.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Chatbot", description = "OpenAI 챗봇 — 키 미설정 시 키워드 기반 stub 응답.")
@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {
    private final ChatbotService chatbotService;

    /** 멀티턴 챗 — body: {messages: [{role, content}, ...]} 또는 단건 {message: "..."} 양쪽 지원. */
    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> ask(@RequestBody Map<String, Object> body) {
        String reply;
        Object rawMessages = body == null ? null : body.get("messages");
        if (rawMessages instanceof List<?> list && !list.isEmpty()) {
            List<Map<String, String>> messages = new java.util.ArrayList<>();
            for (Object o : list) {
                if (!(o instanceof Map<?, ?> m)) continue;
                Object role = m.get("role");
                Object content = m.get("content");
                Map<String, String> turn = new java.util.HashMap<>();
                turn.put("role", role == null ? "user" : String.valueOf(role));
                turn.put("content", content == null ? "" : String.valueOf(content));
                messages.add(turn);
            }
            reply = chatbotService.getChatbotResponse(messages);
        } else {
            String single = body == null ? "" : String.valueOf(body.getOrDefault("message", ""));
            reply = chatbotService.getChatbotResponse(single);
        }
        return ResponseEntity.ok(Map.of(
                "reply", reply,
                "live", chatbotService.isLive()));
    }
}
