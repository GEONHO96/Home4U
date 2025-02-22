package com.piko.home4u.repository;

import com.piko.home4u.model.Realtor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RealtorRepository extends JpaRepository<Realtor, Long> {

    // ✅ 특정 아파트에 속한 모든 공인중개사 조회 (JPQL)
    @Query("SELECT r FROM Realtor r WHERE r.apartment.id = :apartmentId")
    List<Realtor> findByApartmentId(Long apartmentId);

    // ✅ 특정 아파트에 속한 모든 공인중개사 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM realtors WHERE apartment_id = :apartmentId", nativeQuery = true)
    List<Realtor> findByApartmentIdNative(Long apartmentId);

    // ✅ 특정 공인중개사 이름으로 조회 (JPQL)
    @Query("SELECT r FROM Realtor r WHERE r.name = :name")
    List<Realtor> findByName(String name);

    // ✅ 특정 공인중개사 전화번호로 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM realtors WHERE phone_number = :phoneNumber", nativeQuery = true)
    Realtor findByPhoneNumberNative(String phoneNumber);

    // ✅ 특정 지역(구/군)에 속한 공인중개사 목록 조회 (JPQL)
    @Query("SELECT r FROM Realtor r WHERE r.address LIKE %:gungu%")
    List<Realtor> findByGungu(String gungu);

    // ✅ 특정 지역(구/군)에 속한 공인중개사 목록 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM realtors WHERE address LIKE %:gungu%", nativeQuery = true)
    List<Realtor> findByGunguNative(String gungu);

    // ✅ 특정 지역(구/군) 내 공인중개사 개수 조회
    @Query("SELECT COUNT(r) FROM Realtor r WHERE r.address LIKE %:gungu%")
    Long countRealtorsByGungu(String gungu);
}
