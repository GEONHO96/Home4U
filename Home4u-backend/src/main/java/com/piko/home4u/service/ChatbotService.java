package com.piko.home4u.service;

import com.piko.home4u.dto.ChatCompletionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";

    private static final String SYSTEM_PROMPT = ""
            + "당신은 한국 부동산 플랫폼 'Home4U' 의 도우미입니다. "
            + "매물 검색 / 거래 절차 / 안심거래(등기 검증) / 1:1 채팅 / 저장된 검색 / 결제 흐름 / 소셜 로그인 같은 "
            + "서비스 기능을 친절하고 간결한 한국어로 안내합니다. "
            + "정확하지 않은 가격이나 법률 자문은 추측하지 말고 'Home4U 운영자 또는 공인중개사에게 문의해주세요' 라고 답하세요. "
            + "응답은 2~3문장 이내로 핵심만, 마크다운은 가볍게 사용합니다.";

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    private final RestTemplate restTemplate;

    public boolean isLive() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getChatbotResponse(String userMessage) {
        return getChatbotResponse(List.of(Map.of("role", "user", "content", userMessage)));
    }

    /**
     * 멀티턴 메시지 배열을 받는 버전. 각 메시지는 {role, content} 형태.
     * 키가 없으면 결정론적 stub 응답을 반환 — UI 동작 검증용.
     */
    public String getChatbotResponse(List<Map<String, String>> messages) {
        if (messages == null || messages.isEmpty()) {
            return "메시지를 입력해주세요.";
        }
        if (!isLive()) {
            return stubReply(messages.get(messages.size() - 1).get("content"));
        }

        List<Map<String, String>> withSystem = new ArrayList<>();
        withSystem.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        withSystem.addAll(messages);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", withSystem,
                "temperature", 0.4
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<ChatCompletionResponse> response = restTemplate.exchange(
                    OPENAI_URL, HttpMethod.POST, entity, ChatCompletionResponse.class);
            ChatCompletionResponse body = response.getBody();
            if (body == null || body.getChoices() == null || body.getChoices().isEmpty()) {
                return "응답을 생성하지 못했습니다.";
            }
            return Optional.ofNullable(body.getChoices().get(0))
                    .map(choice -> choice.getMessage().getContent())
                    .orElse("응답 데이터 형식 오류");
        } catch (Exception ex) {
            log.warn("OpenAI request failed: {}", ex.getMessage());
            return "지금은 답변을 가져올 수 없어요. 잠시 후 다시 시도해주세요.";
        }
    }

    /** 키 없이도 데모 가능하게: 키워드 기반 결정론적 응답. */
    private static String stubReply(String userMessage) {
        if (userMessage == null) return "안녕하세요! 무엇을 도와드릴까요?";
        String lower = userMessage.toLowerCase(Locale.ROOT);
        if (lower.contains("거래") || lower.contains("매매")) {
            return "거래는 매물 상세 → '거래 요청하기' 로 시작합니다. 판매자가 승인하면 [내 거래] 에서 결제하기를 눌러 안심결제를 진행할 수 있어요.";
        }
        if (lower.contains("안심") || lower.contains("등기")) {
            return "매물 상세의 ✓/⚠ 배지가 등기 검증 요약입니다. 펼치면 근저당·압류·소유자 마스킹 정보가 보여요.";
        }
        if (lower.contains("채팅") || lower.contains("문의")) {
            return "매물 상세의 '💬 채팅 문의' 를 누르면 즉시 1:1 방이 열리고, 새 메시지는 STOMP 로 실시간 수신됩니다.";
        }
        if (lower.contains("저장") || lower.contains("알림")) {
            return "필터 바의 '★ 조건 저장' 으로 검색을 보관하면, 새 매칭 매물이 등록될 때 푸시 알림이 발송됩니다.";
        }
        return "Home4U 도우미입니다 (스텁 모드). OpenAI 키를 설정하면 더 풍부한 답변을 드릴 수 있어요.";
    }
}