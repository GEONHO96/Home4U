package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 데이터 전송 객체(DTO) for Apartment 정보를 전달합니다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentDto {
    /** 고유 식별자 */
    private Long id;

    /** 아파트 이름 */
    private String name;

    /** 주소 */
    private String address;

    /** 위도 */
    private Double latitude;

    /** 경도 */
    private Double longitude;

    // TODO: 필요 시 기타 필드 추가 (예: 가격, 면적, 방 구조 등)
}