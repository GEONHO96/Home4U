package com.piko.home4u.controller;

import com.piko.home4u.model.Payment;
import com.piko.home4u.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /** 결제 인텐트 생성. 거래 ID 만 주면 stub orderId 발급. */
    @PostMapping
    public ResponseEntity<Payment> createIntent(@RequestParam Long transactionId) {
        return ResponseEntity.ok(paymentService.createIntent(transactionId));
    }

    /** stub/PG 의 confirm 콜백. body 에 paymentKey 옵션. */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Payment> confirm(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        String key = body == null ? null : body.get("paymentKey");
        return ResponseEntity.ok(paymentService.confirm(id, key));
    }

    @PostMapping("/{id}/fail")
    public ResponseEntity<Payment> fail(@PathVariable Long id,
                                        @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "사용자 취소" : body.getOrDefault("reason", "사용자 취소");
        return ResponseEntity.ok(paymentService.fail(id, reason));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Payment>> listMine(@RequestParam Long buyerId) {
        return ResponseEntity.ok(paymentService.listByBuyer(buyerId));
    }
}
