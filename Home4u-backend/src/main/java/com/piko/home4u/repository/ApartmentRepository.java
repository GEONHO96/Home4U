package com.piko.home4u.repository;

import com.piko.home4u.dto.ConstructorHeatingDto;
import com.piko.home4u.dto.RatioDto;
import com.piko.home4u.model.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    /** 이름으로 조회 */
    Optional<Apartment> findByName(String name);

    /** 구/군 내 전체 조회 */
    List<Apartment> findByGungu(String gungu);

    /** 동 내 전체 조회 */
    List<Apartment> findByDong(String dong);

    /** 구/군별 개수 조회 */
    Long countByGungu(String gungu);

    /**
     * 용적률(floorAreaRatio)과 건폐율(buildingCoverageRatio)을
     * RatioDto 로 바로 매핑하여 반환
     */
    @Query("""
        SELECT new com.piko.home4u.dto.RatioDto(
            a.floorAreaRatio,
            a.buildingCoverageRatio
        )
        FROM Apartment a
        WHERE a.id = :id
        """)
    RatioDto fetchRatiosById(Long id);

    /**
     * 시공사(constructor)와 난방방식(heatingType)을
     * ConstructorHeatingDto 로 바로 매핑하여 반환
     */
    @Query("""
        SELECT new com.piko.home4u.dto.ConstructorHeatingDto(
            a.constructor,
            a.heatingType
        )
        FROM Apartment a
        WHERE a.id = :id
        """)
    ConstructorHeatingDto fetchConstructorHeatingById(Long id);
}