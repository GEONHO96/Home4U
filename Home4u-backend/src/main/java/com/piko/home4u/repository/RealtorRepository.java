package com.piko.home4u.repository;

import com.piko.home4u.model.Realtor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RealtorRepository extends JpaRepository<Realtor, Long> {
    List<Realtor> findByApartmentId(Long apartmentId);
}