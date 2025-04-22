package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Faq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 질문 제목 또는 키워드 */
    @Column(nullable = false)
    private String question;

    /** 상세 답변 */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    /** 분류(옵션) */
    private String category;

    /** 표시 순서 */
    private Integer sortOrder;

    /** 생성/수정 시각 */
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}