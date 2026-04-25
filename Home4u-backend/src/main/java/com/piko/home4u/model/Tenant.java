package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 멀티테넌시 단위 (예: 부동산 중개사 법인). 모든 도메인 엔티티는 향후
 * `tenant_id` FK 로 격리되며, 요청은 `X-Tenant-Slug` 헤더로 매핑된다.
 *
 * 현재 단계에서는 Tenant 자체만 추가하고, User 가 1:N 으로 소속되는 구조 — 다른
 * 엔티티는 점진적으로 컬럼을 붙인다 (마이그레이션 비용 통제). 라우팅 계층은
 * `TenantContext` 가 담당.
 */
@Entity
@Table(name = "tenants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_slug", columnNames = "slug")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, length = 40)
    private String slug;

    /** 활성 / 정지 (운영자가 결제 미납 등으로 차단). */
    @Column(nullable = false)
    private boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
