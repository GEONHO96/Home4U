package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
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
    private double minArea; // 최소 전용면적

    @Column(nullable = false)
    private double maxArea; // 최대 전용면적

    @ElementCollection
    @Enumerated(EnumType.STRING)
    private List<AdditionalOption> additionalOptions; // 추가 옵션 리스트

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; // 매물 소유자 (중개업자 또는 개인)
}