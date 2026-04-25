package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 모바일 디바이스의 푸시 토큰 (현재는 Expo Push 토큰).
 * 같은 사용자가 여러 디바이스를 가질 수 있으므로 유저 1 - 토큰 N.
 * 토큰 자체는 글로벌 유니크 (디바이스 단위).
 */
@Entity
@Table(name = "push_tokens", uniqueConstraints = {
        @UniqueConstraint(name = "uk_push_token", columnNames = "token")
}, indexes = {
        @Index(name = "idx_push_user", columnList = "user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PushToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String token;

    /** "ios" | "android" | "web" — 통계/디버깅용 */
    @Column(length = 20)
    private String platform;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
