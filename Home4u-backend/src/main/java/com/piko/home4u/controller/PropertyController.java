package com.piko.home4u.controller;

import com.piko.home4u.dto.PropertyDto;
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
    public ResponseEntity<?> addProperty(@RequestBody PropertyDto propertyDto, @RequestParam Long ownerId) {
        Property property = propertyService.addProperty(propertyDto, ownerId);
        return ResponseEntity.ok(Map.of("message", "매물 등록 성공", "propertyId", property.getId()));
    }

    // ✅ 전체 매물 조회 API
    @GetMapping
    public ResponseEntity<List<Property>> getProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    // ✅ 매물 상세 조회 API (다국어 적용)
    @GetMapping("/{id}")
    public ResponseEntity<?> getProperty(@PathVariable Long id, @RequestHeader(name = "Accept-Language", required = false) Locale locale) {
        Property property = propertyService.getPropertyById(id);

        Map<String, Object> response = Map.of(
                messageSource.getMessage("property.title", null, locale), property.getTitle(),
                messageSource.getMessage("property.description", null, locale), property.getDescription(),
                messageSource.getMessage("property.price", null, locale), property.getPrice(),
                messageSource.getMessage("property.address", null, locale), property.getAddress(),
                messageSource.getMessage("property.transactionType", null, locale), property.getTransactionType()
        );
        return ResponseEntity.ok(response);
    }

    // ✅ 매물 삭제 API
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("message", "매물 삭제 성공"));
    }

    // ✅ 지도 기반 검색 API
    @GetMapping("/search")
    public ResponseEntity<List<Property>> searchProperties(
            @RequestParam(required = false) String buildingType,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double maxLng) {
        return ResponseEntity.ok(propertyService.searchProperties(buildingType, minLat, maxLat, minLng, maxLng));
    }

    // ✅ 상세 필터링 검색 API (거래방식, 전용면적, 층수, 방구조, 추가 옵션)
    @GetMapping("/filter")
    public ResponseEntity<List<Property>> filterProperties(
            @RequestParam(required = false) TransactionType transactionType,
            @RequestParam(required = false) Double minArea,
            @RequestParam(required = false) Double maxArea,
            @RequestParam(required = false) Integer minFloor,
            @RequestParam(required = false) Integer maxFloor,
            @RequestParam(required = false) RoomStructure roomStructure,
            @RequestParam(required = false) List<AdditionalOption> additionalOptions) {
        return ResponseEntity.ok(propertyService.filterProperties(transactionType, minArea, maxArea, minFloor, maxFloor, roomStructure, additionalOptions));
    }
}