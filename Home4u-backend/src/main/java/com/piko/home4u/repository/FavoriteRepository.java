package com.piko.home4u.repository;

import com.piko.home4u.model.Favorite;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUserIdAndPropertyId(Long userId, Long propertyId);

    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    long countByPropertyId(Long propertyId);

    // ✅ 내가 찜한 개수
    long countByUserId(Long userId);

    // ✅ 찜이 많은 순 매물 ID + 카운트 (limit 은 Pageable 로 제어)
    //   반환 Object[]: [propertyId: Long, count: Long]
    @Query("SELECT f.property.id AS pid, COUNT(f) AS cnt " +
            "FROM Favorite f " +
            "GROUP BY f.property.id " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> findMostFavoritedPropertyIds(Pageable pageable);
}
