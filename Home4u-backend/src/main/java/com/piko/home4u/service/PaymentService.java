package com.piko.home4u.service;

import com.piko.home4u.model.Payment;
import com.piko.home4u.model.PaymentStatus;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.repository.PaymentRepository;
import com.piko.home4u.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 결제 어댑터. 운영에서는 PG (토스/스트라이프 등) 클라이언트를 connect 해 confirm/refund 를 라우팅.
 *
 * `home4u.payment.provider` 가 비어있으면 'STUB' 모드로 간주하고
 * confirm 시 별도 외부 호출 없이 SUCCEEDED 로 넘긴다 — dev 환경에서 거래 완료 흐름 검증용.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;

    @Autowired(required = false)
    private PushService pushService;

    @Value("${home4u.payment.provider:STUB}")
    private String provider;

    @Transactional
    public Payment createIntent(Long transactionId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("거래를 찾을 수 없습니다."));
        if (tx.getStatus() != TransactionStatus.APPROVED) {
            throw new RuntimeException("승인된 거래만 결제할 수 있습니다.");
        }
        return paymentRepository.findByTransactionId(transactionId)
                .map(existing -> {
                    if (existing.getStatus() == PaymentStatus.SUCCEEDED) {
                        throw new RuntimeException("이미 결제 완료된 거래입니다.");
                    }
                    // 같은 거래에 새 intent 발급 — orderId 갱신
                    existing.setProvider(provider);
                    existing.setProviderOrderId(orderId(tx.getId()));
                    existing.setStatus(PaymentStatus.PENDING);
                    return paymentRepository.save(existing);
                })
                .orElseGet(() -> paymentRepository.save(Payment.builder()
                        .transaction(tx)
                        .provider(provider)
                        .amount(tx.getProperty() != null ? tx.getProperty().getPrice() : 0)
                        .providerOrderId(orderId(tx.getId()))
                        .status(PaymentStatus.PENDING)
                        .build()));
    }

    @Transactional
    public Payment confirm(Long paymentId, String providerPaymentKey) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        if (p.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("PENDING 결제만 confirm 할 수 있습니다.");
        }
        // STUB 모드는 검증 생략 — 운영 모드에서는 여기서 PG confirm API 호출.
        if (!"STUB".equalsIgnoreCase(provider)) {
            log.info("[payment] provider={} 의 외부 confirm API 호출 자리 (placeholder)", provider);
        }
        p.setProviderPaymentKey(providerPaymentKey != null ? providerPaymentKey : "stub-" + UUID.randomUUID());
        p.setStatus(PaymentStatus.SUCCEEDED);
        p.setPaidAt(LocalDateTime.now());

        // 거래 자동 COMPLETED 전이
        Transaction tx = p.getTransaction();
        tx.setStatus(TransactionStatus.COMPLETED);
        tx.setDate(LocalDate.now());
        transactionRepository.save(tx);

        if (pushService != null) {
            if (tx.getSeller() != null) {
                pushService.sendToUser(tx.getSeller().getId(),
                        "결제 완료",
                        "\"" + (tx.getProperty() != null ? tx.getProperty().getTitle() : "거래") + "\" 결제가 완료됐어요.",
                        Map.of("type", "payment.succeeded", "transactionId", tx.getId()));
            }
            if (tx.getBuyer() != null) {
                pushService.sendToUser(tx.getBuyer().getId(),
                        "결제 영수증",
                        "결제 #" + p.getId() + " · " + p.getAmount() + " 만원",
                        Map.of("type", "payment.receipt", "paymentId", p.getId()));
            }
        }
        return paymentRepository.save(p);
    }

    @Transactional
    public Payment fail(Long paymentId, String reason) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        if (p.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("PENDING 결제만 실패 처리할 수 있습니다.");
        }
        p.setStatus(PaymentStatus.FAILED);
        p.setFailureReason(reason);
        return paymentRepository.save(p);
    }

    @Transactional(readOnly = true)
    public List<Payment> listByBuyer(Long buyerId) {
        return paymentRepository.findByTransaction_BuyerIdOrderByCreatedAtDesc(buyerId);
    }

    private static String orderId(Long txId) {
        return "h4u-" + txId + "-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
