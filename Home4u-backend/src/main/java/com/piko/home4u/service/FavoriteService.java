package com.piko.home4u.service;

import com.piko.home4u.model.Favorite;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.FavoriteRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @Transactional
    public Favorite add(Long userId, Long propertyId) {
        // 이미 찜한 경우 기존 row 반환 — idempotent
        return favoriteRepository.findByUserIdAndPropertyId(userId, propertyId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
                    Property property = propertyRepository.findById(propertyId)
                            .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
                    return favoriteRepository.save(
                            Favorite.builder()
                                    .user(user)
                                    .property(property)
                                    .tenant(property.getTenant()) // 멀티테넌시 — 매물의 tenant 상속
                                    .build());
                });
    }

    @Transactional
    public void remove(Long userId, Long propertyId) {
        favoriteRepository.findByUserIdAndPropertyId(userId, propertyId)
                .ifPresent(favoriteRepository::delete);
    }

    public boolean isFavorited(Long userId, Long propertyId) {
        return favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId);
    }

    public List<Favorite> listByUser(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countForProperty(Long propertyId) {
        return favoriteRepository.countByPropertyId(propertyId);
    }

    public long countForUser(Long userId) {
        return favoriteRepository.countByUserId(userId);
    }

    /**
     * 찜이 많은 순 상위 매물 (id, 찜 수) 쌍. 최대 50 개로 clamp.
     * 반환은 Object[] 쌍. 프론트가 쉽게 쓸 수 있도록 LinkedHashMap 리스트로 매핑한다.
     */
    public List<java.util.Map<String, Object>> mostFavorited(int limit) {
        int capped = Math.max(1, Math.min(limit, 50));
        var page = org.springframework.data.domain.PageRequest.of(0, capped);
        return favoriteRepository.findMostFavoritedPropertyIds(page).stream()
                .map(row -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("propertyId", ((Number) row[0]).longValue());
                    m.put("favoriteCount", ((Number) row[1]).longValue());
                    return m;
                })
                .toList();
    }
}
