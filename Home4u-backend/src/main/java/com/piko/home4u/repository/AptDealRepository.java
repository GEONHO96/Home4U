package com.piko.home4u.repository;

import com.piko.home4u.model.AptDeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AptDealRepository extends JpaRepository<AptDeal, Long> {

    List<AptDeal> findByApartmentNameOrderByDealYearMonthAsc(String apartmentName);

    List<AptDeal> findByGunguOrderByDealYearMonthAsc(String gungu);
}
