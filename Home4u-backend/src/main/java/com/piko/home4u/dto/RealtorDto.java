package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Realtor 생성/수정용 DTO. apartment 참조는 id 로만 전달해 엔티티 불변성을 유지.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RealtorDto {
    private Long id;
    private Long apartmentId;
    private String name;
    private String phoneNumber;
    private String address;
    private Double latitude;
    private Double longitude;
}
