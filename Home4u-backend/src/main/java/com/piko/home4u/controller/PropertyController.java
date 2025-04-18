package com.piko.home4u.controller;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.dto.PropertyResponseDto;
import com.piko.home4u.model.*;
import com.piko.home4u.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final MessageSource messageSource;

    // ✅ 매물 등록 API
    @PostMapping
    public ResponseEntity<Map<String, Object>> addProperty(@RequestBody PropertyDto propertyDto,
                                                           @RequestParam Long ownerId) {
        Property property = propertyService.addProperty(propertyDto, ownerId);
        return ResponseEntity.ok(Map.of(
                "message", "매물 등록 성공",
                "propertyId", property.getId()
        ));
    }

    // ✅ 전체 매물 조회 API
    @GetMapping
    public ResponseEntity<List<Property>> getProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    // ✅ 매물 상세 조회 API (다국어 지원 + DTO + 예외 처리)
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponseDto> getProperty(
            @PathVariable Long id,
            @RequestHeader(name = "Accept-Language", required = false) Locale locale) {

        Property property = propertyService.getPropertyById(id);
        if (property == null) {
            return ResponseEntity.notFound().build();
        }

        PropertyResponseDto dto = PropertyResponseDto.builder()
                .title(property.getTitle())
                .description(property.getDescription())
                .price(property.getPrice())
                .address(property.getAddress())
                .transactionType(property.getTransactionType())
                .localizedMessages(Map.of(
                        "title",           messageSource.getMessage("property.title",           null, locale),
                        "description",     messageSource.getMessage("property.description",     null, locale),
                        "price",           messageSource.getMessage("property.price",           null, locale),
                        "address",         messageSource.getMessage("property.address",         null, locale),
                        "transactionType", messageSource.getMessage("property.transactionType", null, locale)
                ))
                .build();

        return ResponseEntity.ok(dto);
    }

    // ✅ 매물 삭제 API
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("message", "매물 삭제 성공"));
    }

    // ✅ 지도 기반 검색 API
    @GetMapping("/search")
    public ResponseEntity<List<Property>> searchProperties(@RequestParam(required = false) String buildingType,
                                                           @RequestParam(required = false) Double minLat,
                                                           @RequestParam(required = false) Double maxLat,
                                                           @RequestParam(required = false) Double minLng,
                                                           @RequestParam(required = false) Double maxLng) {
        return ResponseEntity.ok(propertyService.searchProperties(buildingType, minLat, maxLat, minLng, maxLng));
    }

    // ✅ 상세 필터링 검색 API
    @GetMapping("/filter")
    public ResponseEntity<List<Property>> filterProperties(@RequestParam(required = false) TransactionType transactionType,
                                                           @RequestParam(required = false) Double minArea,
                                                           @RequestParam(required = false) Double maxArea,
                                                           @RequestParam(required = false) Integer minFloor,
                                                           @RequestParam(required = false) Integer maxFloor,
                                                           @RequestParam(required = false) RoomStructure roomStructure,
                                                           @RequestParam(required = false) List<AdditionalOption> additionalOptions) {
        return ResponseEntity.ok(propertyService.filterProperties(transactionType, minArea, maxArea, minFloor, maxFloor, roomStructure, additionalOptions));
    }

    // ✅ 매물 거래 요청 API
    @PostMapping("/{propertyId}/transaction")
    public ResponseEntity<Transaction> requestTransaction(@PathVariable Long propertyId,
                                                          @RequestParam Long buyerId) {
        return ResponseEntity.ok(propertyService.requestTransaction(propertyId, buyerId));
    }

    // ✅ 거래 승인 API
    @PostMapping("/transaction/{transactionId}/approve")
    public ResponseEntity<Map<String, String>> approveTransaction(@PathVariable Long transactionId) {
        propertyService.approveTransaction(transactionId);
        return ResponseEntity.ok(Map.of("message", "거래 승인 완료"));
    }
}
