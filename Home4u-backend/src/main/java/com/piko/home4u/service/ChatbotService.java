package com.piko.home4u.service;

import com.piko.home4u.dto.ChatCompletionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatbotService {
    @Value("${openai.api.key}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    // RestTemplate 은 @Configuration 에서 Bean 으로 등록해 두고 주입받습니다
    private final RestTemplate restTemplate;

    public String getChatbotResponse(String userMessage) {
        // 요청 바디 구성
        Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",
                "messages", List.of(Map.of("role", "user", "content", userMessage))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // DTO 로 직접 매핑
        ResponseEntity<ChatCompletionResponse> response = restTemplate.exchange(
                OPENAI_URL,
                HttpMethod.POST,
                entity,
                ChatCompletionResponse.class
        );

        ChatCompletionResponse body = response.getBody();
        if (body == null || body.getChoices() == null || body.getChoices().isEmpty()) {
            return "❌ 응답이 올바르지 않습니다.";
        }

        // 첫 번째 choice 의 message.content 반환
        return Optional.ofNullable(body.getChoices().get(0))
                .map(choice -> choice.getMessage().getContent())
                .orElse("❌ 응답 데이터 오류");
    }
}