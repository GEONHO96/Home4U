package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;  // 리뷰가 속한 매물

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;  // 리뷰를 작성한 사용자

    @Column(nullable = false)
    private int rating;  // 평점 (1~5점)

    @Column(nullable = false, length = 1000)
    private String comment;  // 리뷰 내용

    @Column(nullable = false)
    private LocalDateTime createdAt;  // 리뷰 작성 날짜

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
