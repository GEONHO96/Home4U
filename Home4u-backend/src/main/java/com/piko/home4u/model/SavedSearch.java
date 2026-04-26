package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자가 저장한 검색 조건.
 * filterJson 에 프론트 FilterParams + keyword 를 JSON 으로 직렬화해 보관한다.
 */
@Entity
@Table(name = "saved_searches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class SavedSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Enumerated(EnumType.STRING)
    private RoomStructure roomStructure;

    private Double minArea;
    private Double maxArea;
    private Integer minFloor;
    private Integer maxFloor;

    private Double minLat;
    private Double maxLat;
    private Double minLng;
    private Double maxLng;

    @Column(length = 120)
    private String keyword;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** 백그라운드 워커가 마지막으로 매칭 알림을 보낸 시각 — 중복 푸시 방지. */
    private LocalDateTime lastNotifiedAt;

    /** 멀티테넌시 — 검색 저장은 user 의 tenant 를 따라간다. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Tenant tenant;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
