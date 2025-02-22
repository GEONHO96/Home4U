package com.piko.home4u.service;

import com.piko.home4u.model.Property;
import com.piko.home4u.model.Review;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.ReviewRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    // ✅ 리뷰 작성
    @Transactional
    public Review addReview(Long propertyId, Long userId, int rating, String comment) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Review review = Review.builder()
                .property(property)
                .user(user)
                .rating(rating)
                .comment(comment)
                .build();

        return reviewRepository.save(review);
    }

    // ✅ 특정 매물의 리뷰 목록 조회
    public List<Review> getReviewsByProperty(Long propertyId) {
        return reviewRepository.findByPropertyId(propertyId);
    }

    // ✅ 특정 매물의 평균 평점 조회
    public double getAverageRating(Long propertyId) {
        Double avgRating = reviewRepository.getAverageRatingByPropertyId(propertyId);
        return (avgRating != null) ? avgRating : 0.0;
    }

    // ✅ 특정 매물의 리뷰 개수 조회
    public Long countReviewsForProperty(Long propertyId) {
        return reviewRepository.countReviewsByPropertyId(propertyId);
    }

    // ✅ 특정 리뷰 삭제 (본인만 삭제 가능)
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("리뷰를 찾을 수 없습니다."));

        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
        }

        reviewRepository.delete(review);
    }
}
