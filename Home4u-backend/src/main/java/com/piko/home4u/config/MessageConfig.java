package com.piko.home4u.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Locale;

@Configuration
public class MessageConfig {

    // ✅ 기본 언어 설정 (한국어)
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
        localeResolver.setDefaultLocale(Locale.KOREAN); // 기본값: 한국어
        return localeResolver;
    }

    // ✅ 다국어 메시지 파일 로드 설정
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:i18n/messages"); // 다국어 파일 위치
        messageSource.setDefaultEncoding("UTF-8"); // UTF-8 인코딩 설정
        messageSource.setCacheSeconds(3600); // 1시간마다 갱신
        return messageSource;
    }
}