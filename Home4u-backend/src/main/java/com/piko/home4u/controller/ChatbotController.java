package com.piko.home4u.controller;

import com.piko.home4u.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {
    private final ChatbotService chatbotService;

    // ✅ 챗봇 응답 API
    @PostMapping("/ask")
    public ResponseEntity<String> getChatbotResponse(@RequestParam String message) {
        String response = chatbotService.getChatbotResponse(message);
        return ResponseEntity.ok(response);
    }
}
