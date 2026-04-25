package com.piko.home4u.config;

/**
 * 요청 단위로 활성 테넌트를 ThreadLocal 에 저장. Filter 가 set/clear 를 책임지고,
 * 서비스 코드는 `TenantContext.currentSlug()` 로 읽기만 한다.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String slug) {
        CURRENT.set(slug);
    }

    public static String currentSlug() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
