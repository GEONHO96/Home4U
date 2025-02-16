package com.piko.home4u.model;

import jakarta.persistence.*;


public class Realtor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // 공인중개사사무소 이름
    private String phoneNumber; // 전화번호
    private String address; // 사무소 주소
    private double latitude;
    private double longitude;

    @ManyToOne
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;
}