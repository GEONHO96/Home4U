package com.piko.home4u.dto;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.piko.home4u.model.AdditionalOption;
import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.RoomStructure;
import com.piko.home4u.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * 매물 상세 조회 응답. 프론트 PropertyDetail 화면이 쓰는 모든 필드를 담는다.
 * Entity 를 직접 노출하지 않기 위한 래퍼이므로, Property 의 public 필드와 1:1 로 유지한다.
 */
@Getter
@Builder
@AllArgsConstructor
@JsonAutoDetect(
        fieldVisibility = JsonAutoDetect.Visibility.ANY,
        getterVisibility = JsonAutoDetect.Visibility.NONE,
        isGetterVisibility = JsonAutoDetect.Visibility.NONE
)
public class PropertyResponseDto {
    private Long id;
    private String title;
    private String description;
    private int price;
    private String address;
    private double latitude;
    private double longitude;
    private String dong;
    private String gungu;
    private PropertyType propertyType;
    private TransactionType transactionType;
    private int floor;
    private RoomStructure roomStructure;
    private double minArea;
    private double maxArea;
    private List<AdditionalOption> additionalOptions;
    @JsonProperty("isSold")
    private boolean isSold;
    private Long ownerId;
    private Map<String, String> localizedMessages;
}
