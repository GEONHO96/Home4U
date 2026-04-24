package com.piko.home4u.service;

import com.piko.home4u.dto.SavedSearchDto;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.SavedSearchRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SavedSearchService {
    private final SavedSearchRepository savedSearchRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @Transactional
    public SavedSearch save(SavedSearchDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        String name = (dto.getName() == null || dto.getName().isBlank()) ? "내 검색" : dto.getName();
        SavedSearch entity = SavedSearch.builder()
                .user(user)
                .name(name)
                .transactionType(dto.getTransactionType())
                .roomStructure(dto.getRoomStructure())
                .minArea(dto.getMinArea())
                .maxArea(dto.getMaxArea())
                .minFloor(dto.getMinFloor())
                .maxFloor(dto.getMaxFloor())
                .minLat(dto.getMinLat())
                .maxLat(dto.getMaxLat())
                .minLng(dto.getMinLng())
                .maxLng(dto.getMaxLng())
                .keyword(dto.getKeyword())
                .build();
        return savedSearchRepository.save(entity);
    }

    public List<SavedSearch> listMy(Long userId) {
        return savedSearchRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        SavedSearch s = savedSearchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("저장된 검색을 찾을 수 없습니다."));
        if (s.getUser() == null || !s.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인이 저장한 검색만 삭제할 수 있습니다.");
        }
        savedSearchRepository.delete(s);
    }

    /**
     * 저장된 검색 조건에 매칭되는 매물을 in-memory 필터링으로 계산.
     * (전용 쿼리를 넣어도 되지만, 다음 단계에서 스케줄러·알림 기능과 엮을 때 함께 정리 예정)
     */
    public List<Property> runMatch(Long id) {
        SavedSearch s = savedSearchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("저장된 검색을 찾을 수 없습니다."));

        return propertyRepository.findAll().stream()
                .filter(p -> s.getTransactionType() == null || p.getTransactionType() == s.getTransactionType())
                .filter(p -> s.getRoomStructure() == null || p.getRoomStructure() == s.getRoomStructure())
                .filter(p -> s.getMinArea() == null || p.getMinArea() >= s.getMinArea())
                .filter(p -> s.getMaxArea() == null || p.getMaxArea() <= s.getMaxArea())
                .filter(p -> s.getMinFloor() == null || p.getFloor() >= s.getMinFloor())
                .filter(p -> s.getMaxFloor() == null || p.getFloor() <= s.getMaxFloor())
                .filter(p -> s.getMinLat() == null || p.getLatitude() >= s.getMinLat())
                .filter(p -> s.getMaxLat() == null || p.getLatitude() <= s.getMaxLat())
                .filter(p -> s.getMinLng() == null || p.getLongitude() >= s.getMinLng())
                .filter(p -> s.getMaxLng() == null || p.getLongitude() <= s.getMaxLng())
                .filter(p -> matchesKeyword(p, s.getKeyword()))
                .toList();
    }

    private static boolean matchesKeyword(Property p, String kw) {
        if (kw == null || kw.isBlank()) return true;
        String q = kw.toLowerCase(Locale.ROOT);
        return (p.getTitle() != null && p.getTitle().toLowerCase(Locale.ROOT).contains(q))
                || (p.getAddress() != null && p.getAddress().toLowerCase(Locale.ROOT).contains(q))
                || (p.getGungu() != null && p.getGungu().toLowerCase(Locale.ROOT).contains(q))
                || (p.getDong() != null && p.getDong().toLowerCase(Locale.ROOT).contains(q));
    }
}
