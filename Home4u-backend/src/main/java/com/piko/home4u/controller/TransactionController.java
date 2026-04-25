package com.piko.home4u.controller;

import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Transactions", description = "거래 조회 (구매자/판매자/상태/날짜/매물별) + 내 거래 요약.")
@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    // 1. 구매자 ID로 조회
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Transaction>> byBuyer(@PathVariable Long buyerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByBuyer(buyerId));
    }

    // 2. 판매자 ID로 조회
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Transaction>> bySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(transactionService.getTransactionsBySeller(sellerId));
    }

    // 3. 상태(status)로 조회
    @GetMapping("/status")
    public ResponseEntity<List<Transaction>> byStatus(@RequestParam TransactionStatus status) {
        return ResponseEntity.ok(transactionService.getTransactionsByStatus(status));
    }

    // 4. 날짜 범위로 조회 (yyyy-MM-dd 포맷)
    @GetMapping("/between")
    public ResponseEntity<List<Transaction>> betweenDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(transactionService.getTransactionsBetweenDates(from, to));
    }

    // 5. 매물(property) ID로 조회
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<Transaction>> byProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(transactionService.getTransactionsByProperty(propertyId));
    }

    // 6. 내 거래 요약 - 상태별 카운트 (구매자/판매자 탭 모두)
    @GetMapping("/me/summary")
    public ResponseEntity<Map<String, Map<String, Long>>> mySummary(@RequestParam Long userId) {
        return ResponseEntity.ok(Map.of(
                "buyer", countByStatus(transactionService.getTransactionsByBuyer(userId)),
                "seller", countByStatus(transactionService.getTransactionsBySeller(userId))
        ));
    }

    private Map<String, Long> countByStatus(List<Transaction> txs) {
        EnumMap<TransactionStatus, Long> map = new EnumMap<>(TransactionStatus.class);
        for (TransactionStatus s : TransactionStatus.values()) map.put(s, 0L);
        for (Transaction tx : txs) {
            TransactionStatus s = tx.getStatus();
            if (s != null) map.merge(s, 1L, Long::sum);
        }
        Map<String, Long> out = new java.util.LinkedHashMap<>();
        for (Map.Entry<TransactionStatus, Long> e : map.entrySet()) {
            out.put(e.getKey().name(), e.getValue());
        }
        out.put("TOTAL", (long) txs.size());
        return out;
    }
}