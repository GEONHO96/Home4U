package com.piko.home4u.service;

import com.piko.home4u.model.Property;
import com.piko.home4u.model.Review;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.ReviewRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ReviewService service;

    private User user(long id) {
        User u = new User("alice", "pw", "a@a.com", "010", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }

    private Property property(long id) {
        Property p = new Property();
        p.setId(id);
        return p;
    }

    @Test
    void createReview_savesWithAssociations() {
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(property(1L)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(99L);
            return r;
        });

        Review r = service.createReview(1L, 2L, 5, "Great");

        assertThat(r.getId()).isEqualTo(99L);
        assertThat(r.getRating()).isEqualTo(5);
        assertThat(r.getComment()).isEqualTo("Great");
        assertThat(r.getProperty().getId()).isEqualTo(1L);
        assertThat(r.getUser().getId()).isEqualTo(2L);
    }

    @Test
    void createReview_missingProperty_throws() {
        when(propertyRepository.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createReview(404L, 2L, 5, "x"))
                .hasMessageContaining("매물");
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void getReviewsByProperty_delegatesToRepo() {
        when(reviewRepository.findByPropertyId(1L))
                .thenReturn(List.of(Review.builder().id(1L).build()));
        assertThat(service.getReviewsByProperty(1L)).hasSize(1);
    }

    @Test
    void getAverageRating_nullResult_treatedAsZero() {
        when(reviewRepository.getAverageRatingByPropertyId(1L)).thenReturn(null);
        assertThat(service.getAverageRating(1L)).isZero();
    }

    @Test
    void getAverageRating_returnsRepoValue() {
        when(reviewRepository.getAverageRatingByPropertyId(1L)).thenReturn(4.25);
        assertThat(service.getAverageRating(1L)).isEqualTo(4.25);
    }

    @Test
    void deleteReview_ownerOnly() {
        Review r = Review.builder().id(5L).user(user(10L)).build();
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(r));

        service.deleteReview(5L, 10L);

        verify(reviewRepository).delete(r);
    }

    @Test
    void deleteReview_differentUser_throws() {
        Review r = Review.builder().id(5L).user(user(10L)).build();
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> service.deleteReview(5L, 99L))
                .hasMessageContaining("본인");
        verify(reviewRepository, never()).delete(any(Review.class));
    }

    @Test
    void deleteReview_missing_throws() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteReview(1L, 1L))
                .hasMessageContaining("리뷰");
    }

    @Test
    void updateReview_ownerUpdatesFields() {
        Review r = Review.builder().id(5L).user(user(10L)).rating(3).comment("old").build();
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(r));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));

        Review updated = service.updateReview(5L, 10L, 5, "new");

        assertThat(updated.getRating()).isEqualTo(5);
        assertThat(updated.getComment()).isEqualTo("new");
    }

    @Test
    void updateReview_differentUser_throws() {
        Review r = Review.builder().id(5L).user(user(10L)).rating(3).comment("old").build();
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> service.updateReview(5L, 99L, 5, "x"))
                .hasMessageContaining("본인");
        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void updateReview_ratingOutOfRange_throws() {
        Review r = Review.builder().id(5L).user(user(10L)).rating(3).comment("old").build();
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> service.updateReview(5L, 10L, 0, "x"))
                .hasMessageContaining("1~5");
    }
}
