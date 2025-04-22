package com.piko.home4u.repository;

import com.piko.home4u.model.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SchoolRepository extends JpaRepository<School, Long> {

    /**
     * 1) 특정 아파트에 직접 연관된 학교만 조회 (기존 기능)
     */
    @Query("SELECT s FROM School s WHERE s.apartment.id = :apartmentId")
    List<School> findByApartmentId(@Param("apartmentId") Long apartmentId);

    /**
     * 2) 특정 아파트 위치를 기준으로 반경 X km 이내의 학교 조회 (Haversine 공식 사용)
     *    - apartment.latitude, apartment.longitude 필드가 있어야 합니다.
     *    - Earth radius: 약 6371 km
     */
    @Query("""
        SELECT s FROM School s, Apartment a
        WHERE a.id = :apartmentId
          AND (
            6371 * acos(
              cos(radians(a.latitude)) * cos(radians(s.latitude))
              * cos(radians(s.longitude) - radians(a.longitude))
              + sin(radians(a.latitude)) * sin(radians(s.latitude))
            )
          ) <= :radiusKm
    """)
    List<School> findNearby(
            @Param("apartmentId") Long apartmentId,
            @Param("radiusKm") double radiusKm
    );
}