package com.piko.home4u.service;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.model.*;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    // ✅ 매물 등록
    public Property addProperty(PropertyDto propertyDto, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("소유자를 찾을 수 없습니다."));

        Property property = Property.builder()
                .title(propertyDto.getTitle())
                .description(propertyDto.getDescription())
                .price(propertyDto.getPrice())
                .address(propertyDto.getAddress())
                .propertyType(propertyDto.getPropertyType())
                .transactionType(propertyDto.getTransactionType())
                .isSold(false)
                .owner(owner)
                .build();

        return propertyRepository.save(property);
    }

    // ✅ 전체 매물 조회
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    // ✅ 특정 매물 조회
    public Property getPropertyById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
    }

    // ✅ 매물 삭제
    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new RuntimeException("삭제할 매물이 존재하지 않습니다.");
        }
        propertyRepository.deleteById(id);
    }

    // ✅ 매물 거래 요청 (구매자가 매물 거래 요청)
    public Transaction requestTransaction(Long propertyId, Long buyerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("구매자를 찾을 수 없습니다."));

        // 거래 생성
        Transaction transaction = Transaction.builder()
                .property(property)
                .buyer(buyer)
                .status(TransactionStatus.PENDING) // 초기 상태: 대기
                .build();

        return transactionRepository.save(transaction);
    }

    // ✅ 거래 승인 (판매자가 승인)
    public void approveTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("거래 요청을 찾을 수 없습니다."));

        transaction.setStatus(TransactionStatus.APPROVED);
        transaction.getProperty().setSold(true);

        transactionRepository.save(transaction);
        propertyRepository.save(transaction.getProperty());
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