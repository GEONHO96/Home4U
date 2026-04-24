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
                            Favorite.builder().user(user).property(property).build());
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
}
