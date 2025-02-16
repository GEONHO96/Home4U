package com.piko.home4u.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/i18n")
@RequiredArgsConstructor
public class I18nController {
    private final MessageSource messageSource;

    // ✅ 다국어 메시지 테스트 API
    public ResponseEntity<String> getMessage(@RequestParam String key, @RequestHeader(name = "Accept-Language", required = false) Locale locale) {
        String message = messageSource.getMessage(key, null, locale);
        return ResponseEntity.ok(message);
    }
}