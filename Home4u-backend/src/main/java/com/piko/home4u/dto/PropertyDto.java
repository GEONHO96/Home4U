package com.piko.home4u.dto;

import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.TransactionType;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PropertyDto {
    private String title;
    private String description;
    private int price;
    private PropertyType propertyType;
    private TransactionType transactionType;
    private String address;
}