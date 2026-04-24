package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * 아파트 실거래가 기록. 국토부 OpenAPI 연동 전까지는 시드된 샘플 데이터로 동작.
 * apartmentName + gungu 조합으로 조회하도록 단순화 (외래키 대신 문자열 매칭).
 */
@Entity
@Table(name = "apt_deals", indexes = {
        @Index(name = "idx_apt_deals_name", columnList = "apartmentName"),
        @Index(name = "idx_apt_deals_date", columnList = "dealYearMonth")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AptDeal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String apartmentName;

    @Column(length = 40)
    private String gungu;

    @Column(length = 40)
    private String dong;

    /** 거래 연월 YYYY-MM 문자열 (정렬 편의) */
    @Column(nullable = false, length = 7)
    private String dealYearMonth;

    /** 거래 가격 (만원 단위) */
    @Column(nullable = false)
    private int price;

    /** 전용 면적 (㎡) */
    @Column(nullable = false)
    private double area;

    @Column(nullable = false)
    private int floor;
}
