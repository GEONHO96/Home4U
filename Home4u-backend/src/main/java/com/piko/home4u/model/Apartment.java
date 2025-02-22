package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "apartments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Apartment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // 아파트 이름

    @Column(nullable = false)
    private String address; // 전체 주소

    @Column(nullable = false)
    private String gungu; // 구/군 (지역 필터용)

    @Column(nullable = false)
    private String dong; // 동 (지역 필터용)

    private int totalUnits; // 총 세대수
    private int totalBuildings; // 총 동수
    private int totalFloors; // 층수
    private String approvalDate; // 사용승인일
    private int totalParking; // 총 주차대수
    private double floorAreaRatio; // 용적률
    private double buildingCoverageRatio; // 건폐율
    private String constructor; // 시공사
    private String heatingType; // 난방 방식

    @Column(nullable = false)
    private double latitude; // 위도

    @Column(nullable = false)
    private double longitude; // 경도

    @ElementCollection
    private List<Double> areaSizes; // 전용면적 리스트
}
