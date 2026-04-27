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

    /**
     * 의도적으로 모든 테넌트 데이터를 스캔해야 하는 백그라운드 / 시드 코드용.
     * 호출 블록 안에서 TenantContext 가 비어 있어 Hibernate filter 가 활성화되지 않는다.
     * 종료 시 이전 컨텍스트를 복원한다.
     */
    public static <T> T runAsAllTenants(java.util.function.Supplier<T> body) {
        String prevSlug = CURRENT_SLUG.get();
        Long prevId = CURRENT_ID.get();
        clear();
        try {
            return body.get();
        } finally {
            if (prevSlug != null) CURRENT_SLUG.set(prevSlug);
            if (prevId != null) CURRENT_ID.set(prevId);
        }
    }

    /** 한 테넌트로 임시 스코프 — 워커가 사용자 단위로 작업할 때 사용. */
    public static <T> T runForTenant(String slug, Long tenantId, java.util.function.Supplier<T> body) {
        String prevSlug = CURRENT_SLUG.get();
        Long prevId = CURRENT_ID.get();
        CURRENT_SLUG.set(slug);
        CURRENT_ID.set(tenantId);
        try {
            return body.get();
        } finally {
            if (prevSlug == null) CURRENT_SLUG.remove(); else CURRENT_SLUG.set(prevSlug);
            if (prevId == null) CURRENT_ID.remove(); else CURRENT_ID.set(prevId);
        }
    }
}
