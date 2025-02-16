package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Apartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // 아파트 이름
    private String address;
    private int totalUnits; // 총 세대수
    private int totalBuildings; // 총 동수
    private int totalFloors; // 층수
    private String approvalDate; // 사용승인일
    private int totalParking; // 총 주차대수
    private double floorAreaRatio; // 용적률
    private double buildingCoverageRatio; // 건폐율
    private String constructor; // 시공사
    private String heatingType; // 난방 방식
    private double latitude;
    private double longitude;

    @ElementCollection
    private List<Double> areaSizes; // 전용면적 리스트
}