package com.piko.home4u.dto;

import com.piko.home4u.model.RoomStructure;
import com.piko.home4u.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedSearchDto {
    private Long id;
    private Long userId;
    private String name;
    private TransactionType transactionType;
    private RoomStructure roomStructure;
    private Double minArea;
    private Double maxArea;
    private Integer minFloor;
    private Integer maxFloor;
    private Double minLat;
    private Double maxLat;
    private Double minLng;
    private Double maxLng;
    private String keyword;
}
