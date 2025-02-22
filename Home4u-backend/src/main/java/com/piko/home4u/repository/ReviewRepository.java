package com.piko.home4u.repository;

import com.piko.home4u.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // ✅ 특정 매물에 대한 모든 리뷰 조회 (최신순)
    @Query("SELECT r FROM Review r WHERE r.property.id = :propertyId ORDER BY r.createdAt DESC")
    List<Review> findByPropertyId(Long propertyId);

    // ✅ 특정 매물의 평균 평점 조회
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.property.id = :propertyId")
    Double getAverageRatingByPropertyId(Long propertyId);

    // ✅ 특정 매물에 대한 리뷰 개수 조회
    @Query("SELECT COUNT(r) FROM Review r WHERE r.property.id = :propertyId")
    Long countReviewsByPropertyId(Long propertyId);
}
