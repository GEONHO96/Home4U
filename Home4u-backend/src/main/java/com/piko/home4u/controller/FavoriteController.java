package com.piko.home4u.controller;

import com.piko.home4u.model.Favorite;
import com.piko.home4u.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 찜하기 (즐겨찾기) REST API.
 * userId 는 프론트가 JWT 에서 읽어 보낸다 (기존 /reviews 컨벤션과 동일).
 */
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {
    private final FavoriteService favoriteService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(
            @RequestParam Long userId,
            @RequestParam Long propertyId
    ) {
        Favorite fav = favoriteService.add(userId, propertyId);
        return ResponseEntity.ok(Map.of(
                "favoriteId", fav.getId(),
                "favorited", true
        ));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> remove(
            @RequestParam Long userId,
            @RequestParam Long propertyId
    ) {
        favoriteService.remove(userId, propertyId);
        return ResponseEntity.ok(Map.of("favorited", false));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> check(
            @RequestParam Long userId,
            @RequestParam Long propertyId
    ) {
        return ResponseEntity.ok(Map.of(
                "favorited", favoriteService.isFavorited(userId, propertyId)
        ));
    }

    @GetMapping
    public ResponseEntity<List<Favorite>> listMy(@RequestParam Long userId) {
        return ResponseEntity.ok(favoriteService.listByUser(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> count(@RequestParam Long propertyId) {
        return ResponseEntity.ok(Map.of(
                "propertyId", propertyId,
                "count", favoriteService.countForProperty(propertyId)
        ));
    }
}
