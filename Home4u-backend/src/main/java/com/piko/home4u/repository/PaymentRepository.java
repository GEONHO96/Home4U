package com.piko.home4u.repository;

import com.piko.home4u.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByTransactionId(Long transactionId);

    List<Payment> findByTransaction_BuyerIdOrderByCreatedAtDesc(Long buyerId);
}
