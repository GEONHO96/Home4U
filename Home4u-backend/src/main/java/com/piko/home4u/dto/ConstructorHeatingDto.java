package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConstructorHeatingDto {
    private String constructor;
    private String heatingType;
}