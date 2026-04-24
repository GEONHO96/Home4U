package com.piko.home4u.service;

import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.ChatMessageRepository;
import com.piko.home4u.repository.ChatRoomRepository;
import com.piko.home4u.repository.FavoriteRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.ReviewRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserStatsService {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteRepository favoriteRepository;
    private final TransactionRepository transactionRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    /**
     * 중개사(또는 매물 소유자) 신뢰도 지표 집계.
     * 응답 속도는 상대 메시지 → 본인의 첫 답신 간 분 차이의 중앙값.
     * 단건 거래/데이터가 적을 때 0 또는 null 로 fallback.
     */
    public RealtorStats computeRealtorStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<Property> myProperties = propertyRepository.findByOwnerIdOrderByIdDesc(userId);

        long totalReviews = 0;
        double ratingSum = 0;
        long totalFavorites = 0;
        for (Property p : myProperties) {
            Long count = reviewRepository.countReviewsByPropertyId(p.getId());
            Double avg = reviewRepository.getAverageRatingByPropertyId(p.getId());
            long cnt = count == null ? 0 : count;
            totalReviews += cnt;
            if (avg != null && cnt > 0) ratingSum += avg * cnt;
            totalFavorites += favoriteRepository.countByPropertyId(p.getId());
        }
        Double averageRating = totalReviews > 0 ? ratingSum / totalReviews : null;

        var sellerTxs = transactionRepository.findBySellerId(userId);
        long approved = sellerTxs.stream()
                .filter(t -> t.getStatus() == TransactionStatus.APPROVED
                        || t.getStatus() == TransactionStatus.COMPLETED)
                .count();
        Double completionRate = sellerTxs.isEmpty() ? null : (double) approved / sellerTxs.size();

        Integer medianResponseMinutes = computeMedianResponseMinutes(userId);

        return RealtorStats.builder()
                .userId(userId)
                .username(user.getUsername())
                .role(user.getRole().name())
                .propertyCount(myProperties.size())
                .totalReviews(totalReviews)
                .averageRating(averageRating)
                .totalFavorites(totalFavorites)
                .totalTransactions(sellerTxs.size())
                .completionRate(completionRate)
                .medianResponseMinutes(medianResponseMinutes)
                .build();
    }

    /**
     * 응답 속도 중위값 계산. 각 채팅방에서 상대가 메시지를 보낸 뒤
     * 내가 처음으로 답신한 시각까지의 분 차이를 모두 모아 median 반환.
     */
    Integer computeMedianResponseMinutes(Long userId) {
        List<Long> deltasSec = new ArrayList<>();

        List<ChatRoom> rooms = chatRoomRepository.findMine(userId);
        for (ChatRoom room : rooms) {
            List<ChatMessage> msgs = chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
            LocalDateTime pendingIncomingAt = null;
            for (ChatMessage m : msgs) {
                boolean fromMe = m.getSender() != null && userId.equals(m.getSender().getId());
                if (fromMe) {
                    if (pendingIncomingAt != null) {
                        long sec = Duration.between(pendingIncomingAt, m.getCreatedAt()).getSeconds();
                        if (sec >= 0) deltasSec.add(sec);
                        pendingIncomingAt = null;
                    }
                } else {
                    if (pendingIncomingAt == null) pendingIncomingAt = m.getCreatedAt();
                }
            }
        }

        if (deltasSec.isEmpty()) return null;
        Collections.sort(deltasSec);
        long midSec = deltasSec.get(deltasSec.size() / 2);
        return (int) Math.max(1, Math.round(midSec / 60.0));
    }

    @Getter
    @lombok.Builder
    public static class RealtorStats {
        private final Long userId;
        private final String username;
        private final String role;
        private final long propertyCount;
        private final long totalReviews;
        private final Double averageRating;      // null = 리뷰 없음
        private final long totalFavorites;
        private final long totalTransactions;
        private final Double completionRate;     // null = 거래 없음
        private final Integer medianResponseMinutes; // null = 채팅 없음
    }
}
