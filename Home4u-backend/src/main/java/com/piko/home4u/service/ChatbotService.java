package com.piko.home4u.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatbotService {
    @Value("${openai.api.key}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    public String getChatbotResponse(String userMessage) {
        // OpenAI API 요청 본문 생성
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", List.of(Map.of("role", "user", "content", userMessage))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<Map> response = restTemplate.exchange(OPENAI_URL, HttpMethod.POST, entity, Map.class);

        // ✅ 응답 데이터 안전하게 변환하기
        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null || !responseBody.containsKey("choices")) {
            return "❌ 응답이 올바르지 않습니다.";
        }

        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
        if (choices == null || choices.isEmpty()) {
            return "❌ OpenAI 응답 없음";
        }

        Map<String, Object> firstChoice = choices.get(0);
        if (!firstChoice.containsKey("message")) {
            return "❌ 응답 메시지가 없습니다.";
        }

        Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
        return (String) message.getOrDefault("content", "❌ 응답 데이터 오류");
    }
}
