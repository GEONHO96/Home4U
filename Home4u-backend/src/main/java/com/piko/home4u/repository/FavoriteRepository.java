package com.piko.home4u.repository;

import com.piko.home4u.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndPropertyId(Long userId, Long propertyId);

    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    long countByPropertyId(Long propertyId);
}
