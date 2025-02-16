package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class School {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String name; // 학교 이름
    private String type; // 초등학교, 중학교 고등학교
    private String address; // 학교 주소
    private double latitude;
    private double longitude;

    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;
}