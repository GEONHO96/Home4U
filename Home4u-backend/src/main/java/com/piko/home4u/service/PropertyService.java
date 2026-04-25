package com.piko.home4u.service;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.model.*;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PropertyService {
    @Autowired(required = false)
    private PushService pushService;

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    // ✅ 매물 등록
    public Property createProperty(PropertyDto propertyDto, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("소유자를 찾을 수 없습니다."));

        Property property = Property.builder()
                .title(propertyDto.getTitle())
                .description(propertyDto.getDescription())
                .price(propertyDto.getPrice())
                .address(propertyDto.getAddress())
                .latitude(propertyDto.getLatitude())
                .longitude(propertyDto.getLongitude())
                .dong(propertyDto.getDong())
                .gungu(propertyDto.getGungu())
                .floor(propertyDto.getFloor())
                .minArea(propertyDto.getMinArea())
                .maxArea(propertyDto.getMaxArea())
                .roomStructure(propertyDto.getRoomStructure())
                .additionalOptions(propertyDto.getAdditionalOptions())
                .propertyType(propertyDto.getPropertyType())
                .transactionType(propertyDto.getTransactionType())
                .imageUrl(resolveCoverImage(propertyDto))
                .imageUrls(propertyDto.getImageUrls())
                .isSold(false)
                .owner(owner)
                .build();

        return propertyRepository.save(property);
    }

    // ✅ 전체 매물 조회
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    // ✅ 페이지네이션 조회 (?page=0&size=20&sort=id,desc)
    public org.springframework.data.domain.Page<Property> getPagedProperties(
            org.springframework.data.domain.Pageable pageable) {
        return propertyRepository.findAll(pageable);
    }

    // ✅ 특정 매물 조회
    public Property getPropertyById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
    }

    // ✅ 상세 조회 시 조회수 증가
    public void incrementViews(Property property) {
        property.setViews(property.getViews() + 1);
        propertyRepository.save(property);
    }

    // ✅ 매물 수정 (REALTOR · 매물 소유자만 허용)
    public Property updateProperty(Long id, Long editorId, PropertyDto dto) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        if (property.getOwner() == null || !property.getOwner().getId().equals(editorId)) {
            throw new RuntimeException("본인이 등록한 매물만 수정할 수 있습니다.");
        }

        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setPrice(dto.getPrice());
        property.setAddress(dto.getAddress());
        property.setLatitude(dto.getLatitude());
        property.setLongitude(dto.getLongitude());
        property.setDong(dto.getDong());
        property.setGungu(dto.getGungu());
        property.setFloor(dto.getFloor());
        property.setMinArea(dto.getMinArea());
        property.setMaxArea(dto.getMaxArea());
        property.setPropertyType(dto.getPropertyType());
        property.setTransactionType(dto.getTransactionType());
        property.setRoomStructure(dto.getRoomStructure());
        property.setAdditionalOptions(dto.getAdditionalOptions());
        if (dto.getImageUrls() != null) {
            property.setImageUrls(dto.getImageUrls());
        }
        String cover = resolveCoverImage(dto);
        if (cover != null) {
            property.setImageUrl(cover);
        }
        return propertyRepository.save(property);
    }

    // 대표 이미지: 명시적으로 지정된 imageUrl > imageUrls[0]
    private static String resolveCoverImage(PropertyDto dto) {
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) return dto.getImageUrl();
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            return dto.getImageUrls().get(0);
        }
        return null;
    }

    // ✅ 매물 삭제
    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new RuntimeException("삭제할 매물이 존재하지 않습니다.");
        }
        propertyRepository.deleteById(id);
    }

    // ✅ 인기 매물 (조회수 내림차순, 상위 limit 개)
    public List<Property> getPopularProperties(int limit) {
        return propertyRepository.findAll(
                org.springframework.data.domain.PageRequest.of(
                        0,
                        Math.max(1, Math.min(limit, 50)),
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "views")))
                .getContent();
    }

    // ✅ 특정 소유자의 매물 목록
    public List<Property> getPropertiesByOwner(Long ownerId) {
        return propertyRepository.findByOwnerIdOrderByIdDesc(ownerId);
    }

    // ✅ 찜이 많은 매물 상위 N — 랭킹 id 리스트를 받아 매물 엔티티를 랭킹 순서대로 반환
    public List<Property> getMostFavoritedProperties(
            List<java.util.Map<String, Object>> ranking) {
        if (ranking == null || ranking.isEmpty()) return List.of();
        java.util.List<Long> ids = ranking.stream()
                .map(r -> ((Number) r.get("propertyId")).longValue())
                .toList();
        java.util.Map<Long, Property> byId = propertyRepository.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(Property::getId, p -> p));
        return ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
    }

    // ✅ 매물 거래 요청 (구매자가 매물 거래 요청)
    public Transaction requestTransaction(Long propertyId, Long buyerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("구매자를 찾을 수 없습니다."));

        // 거래 생성 (seller 는 매물 소유자)
        Transaction transaction = Transaction.builder()
                .property(property)
                .buyer(buyer)
                .seller(property.getOwner())
                .status(TransactionStatus.PENDING) // 초기 상태: 대기
                .build();

        Transaction saved = transactionRepository.save(transaction);
        if (pushService != null && property.getOwner() != null) {
            pushService.sendToUser(property.getOwner().getId(),
                    "새 거래 요청",
                    buyer.getUsername() + "님이 \"" + property.getTitle() + "\" 거래를 요청했어요.",
                    Map.of("type", "transaction.requested", "transactionId", saved.getId(), "propertyId", property.getId()));
        }
        return saved;
    }

    // ✅ 거래 승인 (판매자가 승인)
    public void approveTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("거래 요청을 찾을 수 없습니다."));

        transaction.setStatus(TransactionStatus.APPROVED);
        transaction.getProperty().setSold(true);

        transactionRepository.save(transaction);
        propertyRepository.save(transaction.getProperty());

        if (pushService != null && transaction.getBuyer() != null) {
            pushService.sendToUser(transaction.getBuyer().getId(),
                    "거래 승인",
                    "\"" + transaction.getProperty().getTitle() + "\" 거래가 승인됐어요.",
                    Map.of("type", "transaction.approved", "transactionId", transaction.getId()));
        }
    }

    // ✅ 거래 거절 (판매자가 거절) — 매물의 isSold 는 건드리지 않는다
    public void rejectTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("거래 요청을 찾을 수 없습니다."));

        transaction.setStatus(TransactionStatus.REJECTED);
        transactionRepository.save(transaction);

        if (pushService != null && transaction.getBuyer() != null) {
            pushService.sendToUser(transaction.getBuyer().getId(),
                    "거래 거절",
                    "\"" + transaction.getProperty().getTitle() + "\" 거래가 거절됐어요.",
                    Map.of("type", "transaction.rejected", "transactionId", transaction.getId()));
        }
    }

    // ✅ 지도 기반 검색
    public List<Property> searchProperties(String buildingType, Double minLat, Double maxLat, Double minLng, Double maxLng) {
        if (buildingType != null) {
            return propertyRepository.findByBuildingTypeAndCoordinates(buildingType, minLat, maxLat, minLng, maxLng);
        }
        return propertyRepository.findByCoordinates(minLat, maxLat, minLng, maxLng);
    }

    // ✅ 상세 필터링 검색
    public List<Property> filterProperties(TransactionType transactionType, Double minArea, Double maxArea,
                                           Integer minFloor, Integer maxFloor, RoomStructure roomStructure,
                                           List<AdditionalOption> additionalOptions) {
        return propertyRepository.findByFilters(transactionType, minArea, maxArea, minFloor, maxFloor, roomStructure, additionalOptions);
    }
}