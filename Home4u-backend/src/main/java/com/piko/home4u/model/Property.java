package com.piko.home4u.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
// 필드 기반 직렬화 고정. (@Getter 가 만드는 isSold() 가 Jackson 에 의해
//  "sold" 속성으로 잡혀서 @JsonProperty("isSold") 필드와 중복 노출되는 것을 차단)
@JsonAutoDetect(
        fieldVisibility = JsonAutoDetect.Visibility.ANY,
        getterVisibility = JsonAutoDetect.Visibility.NONE,
        isGetterVisibility = JsonAutoDetect.Visibility.NONE
)
@org.hibernate.annotations.FilterDef(
        name = "tenantFilter",
        parameters = @org.hibernate.annotations.ParamDef(name = "tenantId", type = Long.class))
@org.hibernate.annotations.Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title; // 매물 제목

    @Column(nullable = false)
    private String description; // 매물 설명

    @Column(nullable = false)
    private int price; // 가격

    @Column(nullable = false)
    private double latitude; // 위도

    @Column(nullable = false)
    private double longitude; // 경도

    @Column(nullable = false)
    private String address; // 전체 주소

    @Column(nullable = false)
    private String dong; // 동 (지역 필터용)

    @Column(nullable = false)
    private String gungu; // 구/군 (지역 필터용)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyType propertyType; // 건물 유형 (아파트, 오피스텔, 빌라 등)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType; // 거래 유형 (매매, 전세, 월세)

    @Column(nullable = false)
    private int floor; // 층수

    @Enumerated(EnumType.STRING)
    private RoomStructure roomStructure; // 방 구조 (원룸, 투룸, 쓰리룸 등)

    @Column(nullable = false)
    private double minArea; // 최소 전용면적 (m²)

    @Column(nullable = false)
    private double maxArea; // 최대 전용면적 (m²)

    @ElementCollection
    @Enumerated(EnumType.STRING)
    private List<AdditionalOption> additionalOptions; // 추가 옵션 리스트 (엘리베이터, 주차장 등)

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; // 매물 소유자 (중개업자 또는 개인)

    @Column(nullable = false)
    @JsonProperty("isSold")
    @Builder.Default
    private boolean isSold = false; // 거래 완료 여부 (JSON 필드명: "isSold")

    @Column(length = 1024)
    private String imageUrl; // 대표 이미지 URL (선택, imageUrls 의 첫 번째 항목과 동기화)

    @ElementCollection
    @CollectionTable(name = "property_images", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "image_url", length = 1024)
    private List<String> imageUrls; // 갤러리용 다중 이미지 URL (순서 유지)

    @Column(nullable = false)
    @Builder.Default
    private int views = 0; // 상세 조회수

    /** 멀티테넌시 — 등록 시점의 X-Tenant-Slug 가 가리킨 테넌트로 설정. legacy 는 default 로 backfill. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Tenant tenant;
}