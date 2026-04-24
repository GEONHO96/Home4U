package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name;    // 학교 이름
    private String type;    // 초등학교, 중학교, 고등학교
    private String address;
    private double latitude;
    private double longitude;

    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment; // 연관 아파트 (없으면 null)
}
