package com.piko.home4u.repository;

import com.piko.home4u.model.SubwayStation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubwayStationRepository extends JpaRepository<SubwayStation, Long> {
    boolean existsByNameAndLine(String name, String line);
}
