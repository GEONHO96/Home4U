package com.piko.home4u.repository;

import com.piko.home4u.model.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    // ✅ 특정 아파트 이름으로 조회 (JPQL)
    Optional<Apartment> findByName(String name);

    // ✅ 특정 아파트 이름으로 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM apartments WHERE name = :name LIMIT 1", nativeQuery = true)
    Optional<Apartment> findByNameNative(String name);

    // ✅ 특정 지역(구/군) 내 모든 아파트 조회 (JPQL)
    List<Apartment> findByGungu(String gungu);

    // ✅ 특정 지역(구/군) 내 모든 아파트 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM apartments WHERE gungu = :gungu", nativeQuery = true)
    List<Apartment> findByGunguNative(String gungu);

    // ✅ 특정 동 내 아파트 조회 (JPQL)
    List<Apartment> findByDong(String dong);

    // ✅ 특정 동 내 아파트 조회 (네이티브 SQL)
    @Query(value = "SELECT * FROM apartments WHERE dong = :dong", nativeQuery = true)
    List<Apartment> findByDongNative(String dong);

    // ✅ 특정 지역(구/군) 내 아파트 개수 조회 (JPQL)
    Long countByGungu(String gungu);

    // ✅ 특정 지역(구/군) 내 아파트 개수 조회 (네이티브 SQL)
    @Query(value = "SELECT COUNT(*) FROM apartments WHERE gungu = :gungu", nativeQuery = true)
    Long countApartmentsByGunguNative(String gungu);

    // ✅ 특정 아파트의 용적률과 건폐율 조회 (JPQL)
    @Query("SELECT a.floorAreaRatio, a.buildingCoverageRatio FROM Apartment a WHERE a.id = :id")
    Object[] findRatiosById(Long id);

    // ✅ 특정 아파트의 시공사 및 난방 방식 조회 (네이티브 SQL)
    @Query(value = "SELECT constructor, heating_type FROM apartments WHERE id = :id", nativeQuery = true)
    Object[] findConstructorAndHeatingByIdNative(Long id);
}
