package com.piko.home4u.repository;

import com.piko.home4u.model.AdditionalOption;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.RoomStructure;
import com.piko.home4u.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    // ✅ 특정 좌표 범위 내 모든 매물 검색
    @Query("SELECT p FROM Property p WHERE " +
            "p.latitude BETWEEN :minLat AND :maxLat " +
            "AND p.longitude BETWEEN :minLng AND :maxLng")
    List<Property> findByCoordinates(Double minLat, Double maxLat, Double minLng, Double maxLng);

    // ✅ 특정 건물 유형 + 특정 좌표 범위 내 매물 검색
    @Query("SELECT p FROM Property p WHERE p.propertyType = :buildingType " +
            "AND p.latitude BETWEEN :minLat AND :maxLat " +
            "AND p.longitude BETWEEN :minLng AND :maxLng")
    List<Property> findByBuildingTypeAndCoordinates(String buildingType, Double minLat, Double maxLat, Double minLng, Double maxLng);

    // ✅ 건물 유형 + 지역 필터 적용
    @Query("SELECT p FROM Property p WHERE p.propertyType = :buildingType " +
            "AND p.dong = :dong AND p.gungu = :gungu " +
            "AND p.latitude BETWEEN :minLat AND :maxLat " +
            "AND p.longitude BETWEEN :minLng AND :maxLng")
    List<Property> findByBuildingTypeAndLocation(String buildingType, String dong, String gungu, Double minLat, Double maxLat, Double minLng, Double maxLng);

    // ✅ 상세 필터링 검색
    @Query("SELECT p FROM Property p WHERE " +
            "(:transactionType IS NULL OR p.transactionType = :transactionType) " +
            "AND (:minArea IS NULL OR p.minArea >= :minArea) " +
            "AND (:maxArea IS NULL OR p.maxArea <= :maxArea) " +
            "AND (:minFloor IS NULL OR p.floor >= :minFloor) " +
            "AND (:maxFloor IS NULL OR p.floor <= :maxFloor) " +
            "AND (:roomStructure IS NULL OR p.roomStructure = :roomStructure) " +
            "AND (:additionalOptions IS NULL OR :additionalOptions MEMBER OF p.additionalOptions)")
    List<Property> findByFilters(TransactionType transactionType, Double minArea, Double maxArea,
                                 Integer minFloor, Integer maxFloor, RoomStructure roomStructure,
                                 List<AdditionalOption> additionalOptions);



}
