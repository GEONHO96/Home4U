package com.piko.home4u.controller;

import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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
}