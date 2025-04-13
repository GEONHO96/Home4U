package com.piko.home4u.dto;

import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PropertyDto {
    private String title;
    private String description;
    private int price;
    private PropertyType propertyType;
    private TransactionType transactionType;
    private String address;
}