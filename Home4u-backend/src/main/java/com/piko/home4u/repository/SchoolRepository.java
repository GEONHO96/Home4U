package com.piko.home4u.repository;

import com.piko.home4u.model.School;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findByApartmentId(Long apartmentId);
}