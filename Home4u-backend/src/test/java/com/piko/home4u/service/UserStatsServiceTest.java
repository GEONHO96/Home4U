package com.piko.home4u.service;

import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.ChatMessageRepository;
import com.piko.home4u.repository.ChatRoomRepository;
import com.piko.home4u.repository.FavoriteRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.ReviewRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserStatsServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private FavoriteRepository favoriteRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private ChatRoomRepository chatRoomRepository;
    @Mock private ChatMessageRepository chatMessageRepository;

    @InjectMocks private UserStatsService service;

    private User user(long id, String name, UserRole role) {
        User u = new User(name, "pw", name + "@x", "010", role);
        u.setId(id);
        return u;
    }

    private Property property(long id) {
        Property p = new Property();
        p.setId(id);
        return p;
    }

    private Transaction tx(long id, Long sellerId, TransactionStatus status) {
        return Transaction.builder()
                .id(id)
                .seller(sellerId == null ? null : user(sellerId, "s" + sellerId, UserRole.ROLE_REALTOR))
                .status(status)
                .build();
    }

    private ChatMessage msg(long senderId, LocalDateTime at) {
        return ChatMessage.builder()
                .sender(user(senderId, "u" + senderId, UserRole.ROLE_USER))
                .content("x")
                .createdAt(at)
                .build();
    }

    @Test
    void computeRealtorStats_emptyData_fallsBackToNullAndZero() {
        long uid = 1L;
        when(userRepository.findById(uid)).thenReturn(Optional.of(user(uid, "alice", UserRole.ROLE_REALTOR)));
        when(propertyRepository.findByOwnerIdOrderByIdDesc(uid)).thenReturn(List.of());
        when(transactionRepository.findBySellerId(uid)).thenReturn(List.of());
        when(chatRoomRepository.findMine(uid)).thenReturn(List.of());

        UserStatsService.RealtorStats stats = service.computeRealtorStats(uid);

        assertThat(stats.getUsername()).isEqualTo("alice");
        assertThat(stats.getPropertyCount()).isZero();
        assertThat(stats.getTotalReviews()).isZero();
        assertThat(stats.getAverageRating()).isNull();
        assertThat(stats.getTotalFavorites()).isZero();
        assertThat(stats.getTotalTransactions()).isZero();
        assertThat(stats.getCompletionRate()).isNull();
        assertThat(stats.getMedianResponseMinutes()).isNull();
    }

    @Test
    void computeRealtorStats_aggregatesRatingsFavoritesTransactions() {
        long uid = 2L;
        Property p1 = property(10L);
        Property p2 = property(20L);

        when(userRepository.findById(uid)).thenReturn(Optional.of(user(uid, "bob", UserRole.ROLE_REALTOR)));
        when(propertyRepository.findByOwnerIdOrderByIdDesc(uid)).thenReturn(List.of(p1, p2));

        // p1: 리뷰 2건 평점 4.0 / p2: 리뷰 3건 평점 5.0 → 가중평균 = (2*4 + 3*5) / 5 = 4.6
        when(reviewRepository.countReviewsByPropertyId(10L)).thenReturn(2L);
        when(reviewRepository.getAverageRatingByPropertyId(10L)).thenReturn(4.0);
        when(reviewRepository.countReviewsByPropertyId(20L)).thenReturn(3L);
        when(reviewRepository.getAverageRatingByPropertyId(20L)).thenReturn(5.0);

        when(favoriteRepository.countByPropertyId(10L)).thenReturn(7L);
        when(favoriteRepository.countByPropertyId(20L)).thenReturn(3L);

        // 거래 4건: COMPLETED, APPROVED, PENDING, REJECTED → 완료율 = 2/4 = 0.5
        when(transactionRepository.findBySellerId(uid)).thenReturn(List.of(
                tx(1L, uid, TransactionStatus.COMPLETED),
                tx(2L, uid, TransactionStatus.APPROVED),
                tx(3L, uid, TransactionStatus.PENDING),
                tx(4L, uid, TransactionStatus.REJECTED)
        ));

        when(chatRoomRepository.findMine(uid)).thenReturn(List.of());

        UserStatsService.RealtorStats stats = service.computeRealtorStats(uid);

        assertThat(stats.getPropertyCount()).isEqualTo(2);
        assertThat(stats.getTotalReviews()).isEqualTo(5);
        assertThat(stats.getAverageRating()).isEqualTo(4.6);
        assertThat(stats.getTotalFavorites()).isEqualTo(10);
        assertThat(stats.getTotalTransactions()).isEqualTo(4);
        assertThat(stats.getCompletionRate()).isEqualTo(0.5);
    }

    @Test
    void computeMedianResponseMinutes_returnsMedianMinutes() {
        long me = 5L;
        long other = 9L;
        ChatRoom room = ChatRoom.builder().id(1L).build();

        when(chatRoomRepository.findMine(me)).thenReturn(List.of(room));

        // 상대 보낸 시각 → 내가 답신한 시각 으로 3회의 응답 간격이 생기게 구성
        // Δ: 10분, 30분, 50분 → 중위값 = 30분
        LocalDateTime t0 = LocalDateTime.of(2026, 4, 1, 9, 0);
        when(chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(
                msg(other, t0),
                msg(me,    t0.plusMinutes(10)),  // Δ 10
                msg(other, t0.plusMinutes(60)),
                msg(me,    t0.plusMinutes(90)),  // Δ 30
                msg(other, t0.plusMinutes(120)),
                msg(me,    t0.plusMinutes(170))  // Δ 50
        ));

        Integer median = service.computeMedianResponseMinutes(me);

        assertThat(median).isEqualTo(30);
    }

    @Test
    void computeMedianResponseMinutes_noChats_returnsNull() {
        when(chatRoomRepository.findMine(1L)).thenReturn(Collections.emptyList());
        assertThat(service.computeMedianResponseMinutes(1L)).isNull();
    }

    @Test
    void computeMedianResponseMinutes_onlyIncomingNoReply_returnsNull() {
        long me = 5L;
        long other = 9L;
        ChatRoom room = ChatRoom.builder().id(1L).build();

        when(chatRoomRepository.findMine(me)).thenReturn(List.of(room));
        when(chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(
                msg(other, LocalDateTime.now()),
                msg(other, LocalDateTime.now().plusMinutes(5))
        ));

        assertThat(service.computeMedianResponseMinutes(me)).isNull();
    }

    @Test
    void computeRealtorStats_userNotFound_throws() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.computeRealtorStats(42L))
                .hasMessageContaining("사용자를 찾을 수 없습니다");
    }
}
