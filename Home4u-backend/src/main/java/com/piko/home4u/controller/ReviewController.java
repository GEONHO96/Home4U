package com.piko.home4u.controller;

import com.piko.home4u.model.Review;
import com.piko.home4u.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    // ✅ 리뷰 작성 API
    @PostMapping
    public ResponseEntity<Map<String,Object>> addReview(
            @RequestParam("propertyId") Long propertyId,
            @RequestParam("userId")     Long userId,
            @RequestParam("rating")     int    rating,
            @RequestParam("comment")    String comment
    ) {
        Review review = reviewService.addReview(propertyId, userId, rating, comment);
        return ResponseEntity.ok(Map.of(
                "message", "리뷰 작성 성공",
                "reviewId", review.getId()
        ));
    }

    // ✅ 특정 매물의 리뷰 조회 API
    @GetMapping("/{propertyId}")
    public ResponseEntity<List<Review>> getReviewsByProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getReviewsByProperty(propertyId));
    }

    // ✅ 특정 매물의 평균 평점 조회 API
    @GetMapping("/{propertyId}/rating")
    public ResponseEntity<Map<String, Object>> getAverageRating(@PathVariable Long propertyId) {
        double averageRating = reviewService.getAverageRating(propertyId);
        return ResponseEntity.ok(Map.of("propertyId", propertyId, "averageRating", averageRating));
    }

    // ✅ 특정 매물의 리뷰 개수 조회 API
    @GetMapping("/{propertyId}/count")
    public ResponseEntity<Map<String, Object>> countReviews(@PathVariable Long propertyId) {
        Long reviewCount = reviewService.countReviewsForProperty(propertyId);
        return ResponseEntity.ok(Map.of("propertyId", propertyId, "reviewCount", reviewCount));
    }

    // ✅ 리뷰 삭제 API (본인만 삭제 가능)
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, Object>> deleteReview(@PathVariable Long reviewId, @RequestParam Long userId) {
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(Map.of("message", "리뷰 삭제 성공"));
    }
}