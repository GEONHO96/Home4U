package com.piko.home4u.controller;

import com.piko.home4u.model.Payment;
import com.piko.home4u.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Payments", description = "결제 인텐트 생성 / confirm / fail. STUB 모드면 confirm 시 자동으로 거래가 COMPLETED 로 전이.")
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "결제 인텐트 생성",
            description = "APPROVED 상태의 거래에 대해서만 PENDING 결제 row 를 만들고 providerOrderId 를 반환.")
    @PostMapping
    public ResponseEntity<Payment> createIntent(@RequestParam Long transactionId) {
        return ResponseEntity.ok(paymentService.createIntent(transactionId));
    }

    @Operation(summary = "결제 confirm",
            description = "PENDING 결제를 SUCCEEDED 로 전이. 거래는 자동으로 COMPLETED 로, 매물은 isSold=true.")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Payment> confirm(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> body) {
        String key = body == null ? null : body.get("paymentKey");
        return ResponseEntity.ok(paymentService.confirm(id, key));
    }

    @Operation(summary = "결제 실패 처리", description = "사용자 취소/카드 거부 등 시 PENDING → FAILED.")
    @PostMapping("/{id}/fail")
    public ResponseEntity<Payment> fail(@PathVariable Long id,
                                        @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? "사용자 취소" : body.getOrDefault("reason", "사용자 취소");
        return ResponseEntity.ok(paymentService.fail(id, reason));
    }

    @Operation(summary = "내 결제 이력")
    @GetMapping("/me")
    public ResponseEntity<List<Payment>> listMine(@RequestParam Long buyerId) {
        return ResponseEntity.ok(paymentService.listByBuyer(buyerId));
    }
}
