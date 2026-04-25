package com.piko.home4u.service;

import com.piko.home4u.model.Payment;
import com.piko.home4u.model.PaymentStatus;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.repository.PaymentRepository;
import com.piko.home4u.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks private PaymentService service;

    private Transaction tx(long id, TransactionStatus status) {
        Property p = new Property();
        p.setId(1L);
        p.setTitle("Test Apt");
        p.setPrice(50000);
        return Transaction.builder().id(id).status(status).property(p).build();
    }

    @Test
    void createIntent_approvedTransaction_createsPending() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(tx(1L, TransactionStatus.APPROVED)));
        when(paymentRepository.findByTransactionId(1L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(7L);
            return p;
        });

        Payment p = service.createIntent(1L);

        assertThat(p.getId()).isEqualTo(7L);
        assertThat(p.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(p.getAmount()).isEqualTo(50000);
        assertThat(p.getProviderOrderId()).startsWith("h4u-1-");
    }

    @Test
    void createIntent_pendingTransaction_rejected() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(tx(1L, TransactionStatus.PENDING)));
        assertThatThrownBy(() -> service.createIntent(1L))
                .hasMessageContaining("승인된");
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createIntent_alreadySucceeded_rejected() {
        Transaction t = tx(1L, TransactionStatus.APPROVED);
        Payment existing = Payment.builder().id(5L).status(PaymentStatus.SUCCEEDED).build();
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(t));
        when(paymentRepository.findByTransactionId(1L)).thenReturn(Optional.of(existing));
        assertThatThrownBy(() -> service.createIntent(1L))
                .hasMessageContaining("이미 결제");
    }

    @Test
    void confirm_pending_marksSucceededAndCompletesTransaction() {
        Transaction t = tx(1L, TransactionStatus.APPROVED);
        Payment pay = Payment.builder().id(7L).transaction(t).status(PaymentStatus.PENDING).amount(50000).build();
        when(paymentRepository.findById(7L)).thenReturn(Optional.of(pay));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment after = service.confirm(7L, "stub-key-xyz");

        assertThat(after.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
        assertThat(after.getProviderPaymentKey()).isEqualTo("stub-key-xyz");
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(t.getDate()).isNotNull();
    }

    @Test
    void confirm_nonPending_rejected() {
        Payment pay = Payment.builder().id(7L).status(PaymentStatus.SUCCEEDED).build();
        when(paymentRepository.findById(7L)).thenReturn(Optional.of(pay));
        assertThatThrownBy(() -> service.confirm(7L, "k"))
                .hasMessageContaining("PENDING");
    }

    @Test
    void fail_pending_marksFailed() {
        Payment pay = Payment.builder().id(7L).status(PaymentStatus.PENDING).build();
        when(paymentRepository.findById(7L)).thenReturn(Optional.of(pay));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment after = service.fail(7L, "카드 한도 초과");

        assertThat(after.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(after.getFailureReason()).contains("한도");
    }
}
