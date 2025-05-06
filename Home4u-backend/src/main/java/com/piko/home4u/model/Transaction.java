package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 매물
    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // 구매자
    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    // 판매자 (findBySellerId 를 위해 반드시 필요)
    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    // 거래 상태
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    // 거래 날짜 (findByDateBetween 에서 사용)
    private LocalDate date;
}