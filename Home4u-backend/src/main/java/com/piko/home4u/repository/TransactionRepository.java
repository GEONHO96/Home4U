package com.piko.home4u.repository;

import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;


@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // 1. 구매자 ID로 거래 조회
    @Query("SELECT t FROM Transaction t WHERE t.buyer.id = :buyerId")
    List<Transaction> findByBuyerId(@Param("buyerId") Long buyerId);

    // 2. 판매자 ID로 거래 조회
    @Query("SELECT t FROM Transaction t WHERE t.seller.id = :sellerId")
    List<Transaction> findBySellerId(@Param("sellerId") Long sellerId);

    // 3. 상태(status)로 거래 조회
    @Query("SELECT t FROM Transaction t WHERE t.status = :status")
    List<Transaction> findByStatus(@Param("status") TransactionStatus status);

    // 4. 날짜 범위(Date) 내 거래 조회
    @Query("SELECT t FROM Transaction t WHERE t.date BETWEEN :from AND :to")
    List<Transaction> findByDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // 5. 프로퍼티(property) ID로 거래 조회
    @Query("SELECT t FROM Transaction t WHERE t.property.id = :propertyId")
    List<Transaction> findByPropertyId(@Param("propertyId") Long propertyId);
}