package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "realtors") // ✅ 테이블 명 설정
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Realtor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // 공인중개사사무소 이름

    @Column(nullable = false, unique = true)
    private String phoneNumber; // 전화번호 (고유값)

    @Column(nullable = false)
    private String address; // 사무소 주소

    @Column(nullable = false)
    private double latitude; // 위도

    @Column(nullable = false)
    private double longitude; // 경도

    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment; // 해당 공인중개사가 담당하는 아파트
}
