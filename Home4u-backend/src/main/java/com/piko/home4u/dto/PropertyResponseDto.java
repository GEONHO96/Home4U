package com.piko.home4u.dto;

import com.piko.home4u.model.TransactionType;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class PropertyResponseDto {
    private String title;
    private String description;
    private int price;
    private String address;
    private TransactionType transactionType;
    private Map<String, String> localizedMessages; // 다국어 지원 메시지 추가
}