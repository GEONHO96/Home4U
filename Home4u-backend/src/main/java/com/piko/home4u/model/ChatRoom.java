package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 1:1 채팅방. (buyer, seller, property) 조합이 자연스러운 유니크 키.
 * property 는 null 허용 (일반 문의용으로도 쓸 수 있도록).
 */
@Entity
@Table(
        name = "chat_rooms",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chat_room_buyer_seller_property",
                columnNames = {"buyer_id", "seller_id", "property_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne
    @JoinColumn(name = "property_id")
    private Property property;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /** 메시지 전송 시마다 갱신 → 최신순 정렬에 사용 */
    @Column(nullable = false)
    private LocalDateTime lastMessageAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.lastMessageAt == null) this.lastMessageAt = this.createdAt;
    }
}
