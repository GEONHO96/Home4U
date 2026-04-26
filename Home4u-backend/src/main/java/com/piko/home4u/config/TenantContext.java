package com.piko.home4u.config;

/**
 * 요청 단위로 활성 테넌트를 ThreadLocal 에 저장.
 * - slug: 인입 헤더 값 ('default', 'demo-realty' 등)
 * - tenantId: Hibernate @Filter 의 :tenantId 파라미터로 사용할 PK
 * 둘 다 TenantFilter 가 set/clear 를 책임진다.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_SLUG = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_ID = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String slug, Long tenantId) {
        CURRENT_SLUG.set(slug);
        CURRENT_ID.set(tenantId);
    }

    public static String currentSlug() {
        return CURRENT_SLUG.get();
    }

    public static Long currentTenantId() {
        return CURRENT_ID.get();
    }

    public static void clear() {
        CURRENT_SLUG.remove();
        CURRENT_ID.remove();
    }
}
