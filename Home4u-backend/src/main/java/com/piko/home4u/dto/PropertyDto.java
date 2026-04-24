package com.piko.home4u.dto;

import com.piko.home4u.model.AdditionalOption;
import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.RoomStructure;
import com.piko.home4u.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PropertyDto {
    private String title;
    private String description;
    private int price;
    private PropertyType propertyType;
    private TransactionType transactionType;
    private String address;

    // Property 엔티티의 nullable=false 필드 반영
    private double latitude;
    private double longitude;
    private String dong;
    private String gungu;
    private int floor;
    private double minArea;
    private double maxArea;

    private RoomStructure roomStructure;
    private List<AdditionalOption> additionalOptions;

    private String imageUrl;
}
