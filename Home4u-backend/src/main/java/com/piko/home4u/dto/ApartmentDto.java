package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Apartment 생성/수정용 입력 DTO. id 는 수정 응답에만 쓰인다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentDto {
    private Long id;
    private String name;
    private String address;
    private String gungu;
    private String dong;
    private Integer totalUnits;
    private Integer totalBuildings;
    private Integer totalFloors;
    private String approvalDate;
    private Integer totalParking;
    private Double floorAreaRatio;
    private Double buildingCoverageRatio;
    private String constructor;
    private String heatingType;
    private Double latitude;
    private Double longitude;
    private List<Double> areaSizes;
}
