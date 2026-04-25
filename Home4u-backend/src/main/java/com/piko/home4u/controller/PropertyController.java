package com.piko.home4u.controller;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.dto.PropertyResponseDto;
import com.piko.home4u.model.*;
import com.piko.home4u.service.FavoriteService;
import com.piko.home4u.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Tag(name = "Properties", description = "매물 CRUD / 검색 / 필터 / 거래 요청·승인·거절 / 인기·페이지네이션·수정")
@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final FavoriteService favoriteService;
    private final MessageSource messageSource;

    @Operation(summary = "매물 등록", description = "ownerId 의 tenant 가 매물에 자동으로 부여된다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProperty(@RequestBody PropertyDto propertyDto,
                                                              @RequestParam Long ownerId) {
        Property property = propertyService.createProperty(propertyDto, ownerId);
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

    // ✅ 페이지네이션 조회 API
    //   GET /properties/page?page=0&size=20&sort=id,desc
    //   응답: Spring Data Page JSON (content, totalElements, totalPages, number, size, ...)
    @GetMapping("/page")
    public ResponseEntity<org.springframework.data.domain.Page<Property>> getPagedProperties(
            @org.springframework.data.web.PageableDefault(size = 20, sort = "id",
                    direction = org.springframework.data.domain.Sort.Direction.DESC)
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(propertyService.getPagedProperties(pageable));
    }

    // ✅ 매물 상세 조회 API (다국어 지원 + DTO + 예외 처리)
    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponseDto> getProperty(
            @PathVariable Long id,
            @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {

        // 브라우저는 "ko,en;q=0.9,en-US;q=0.8" 형태로 다중 언어를 보낸다.
        // 첫 번째 태그만 꺼내 Locale.forLanguageTag 로 안전하게 파싱.
        Locale locale = Locale.KOREAN;
        if (acceptLanguage != null && !acceptLanguage.isBlank()) {
            String first = acceptLanguage.split(",")[0].split(";")[0].trim();
            Locale parsed = Locale.forLanguageTag(first);
            if (!parsed.getLanguage().isEmpty()) {
                locale = parsed;
            }
        }

        Property property = propertyService.getPropertyById(id);
        if (property == null) {
            return ResponseEntity.notFound().build();
        }
        // 상세 조회 시 조회수 증가
        propertyService.incrementViews(property);

        PropertyResponseDto dto = PropertyResponseDto.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .price(property.getPrice())
                .address(property.getAddress())
                .latitude(property.getLatitude())
                .longitude(property.getLongitude())
                .dong(property.getDong())
                .gungu(property.getGungu())
                .propertyType(property.getPropertyType())
                .transactionType(property.getTransactionType())
                .floor(property.getFloor())
                .roomStructure(property.getRoomStructure())
                .minArea(property.getMinArea())
                .maxArea(property.getMaxArea())
                .additionalOptions(property.getAdditionalOptions())
                .isSold(property.isSold())
                .imageUrl(property.getImageUrl())
                .imageUrls(property.getImageUrls())
                .views(property.getViews())
                .ownerId(property.getOwner() != null ? property.getOwner().getId() : null)
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

    // ✅ 매물 수정 API (본인 소유 매물만)
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProperty(
            @PathVariable Long id,
            @RequestParam Long editorId,
            @RequestBody PropertyDto dto) {
        Property updated = propertyService.updateProperty(id, editorId, dto);
        return ResponseEntity.ok(Map.of(
                "message", "매물 수정 성공",
                "propertyId", updated.getId()
        ));
    }

    // ✅ 매물 삭제 API
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("message", "매물 삭제 성공"));
    }

    // ✅ 인기 매물 (조회수 순)
    @GetMapping("/popular")
    public ResponseEntity<List<Property>> popular(@RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(propertyService.getPopularProperties(limit));
    }

    // ✅ 인기 찜 매물 (찜 수 많은 순, FavoriteService 가 계산한 id 랭킹을 기반으로)
    @GetMapping("/most-favorited")
    public ResponseEntity<List<Property>> mostFavorited(@RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(
                propertyService.getMostFavoritedProperties(favoriteService.mostFavorited(limit)));
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
    @PostMapping("/{propertyId}/transactions")
    public ResponseEntity<Transaction> requestTransaction(@PathVariable Long propertyId,
                                                          @RequestParam Long buyerId) {
        return ResponseEntity.ok(propertyService.requestTransaction(propertyId, buyerId));
    }

    // ✅ 거래 승인 API
    @PostMapping("/transactions/{transactionId}/approve")
    public ResponseEntity<Map<String, String>> approveTransaction(@PathVariable Long transactionId) {
        propertyService.approveTransaction(transactionId);
        return ResponseEntity.ok(Map.of("message", "거래 승인 완료"));
    }

    // ✅ 거래 거절 API
    @PostMapping("/transactions/{transactionId}/reject")
    public ResponseEntity<Map<String, String>> rejectTransaction(@PathVariable Long transactionId) {
        propertyService.rejectTransaction(transactionId);
        return ResponseEntity.ok(Map.of("message", "거래 거절 완료"));
    }
}
