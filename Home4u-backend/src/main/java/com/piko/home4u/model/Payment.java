package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 거래 1건당 결제 1건 (1:1) 가정 — 부분/분할 결제는 미지원.
 * provider 는 'STUB' / 'TOSS' / 'STRIPE' 등의 식별자.
 * providerOrderId 는 결제사에서 issue 한 주문 키, providerPaymentKey 는 confirm 시 받는 영수증 키.
 */
@Entity
@Table(name = "payments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_transaction", columnNames = "transaction_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @Column(nullable = false, length = 24)
    private String provider;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PaymentStatus status;

    @Column(length = 80)
    private String providerOrderId;

    @Column(length = 120)
    private String providerPaymentKey;

    private String failureReason;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = PaymentStatus.PENDING;
    }
}
