package com.piko.home4u.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChatCompletionResponse {
    // OpenAI JSON 의 "choices" 키와 일치시킵니다
    private List<Choice> choices;

    @Data
    public static class Choice {
        private Message message;

        @Data
        public static class Message {
            private String content;
        }
    }
}