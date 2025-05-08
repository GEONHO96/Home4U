package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RatioDto {
    private double floorAreaRatio;
    private double buildingCoverageRatio;
}