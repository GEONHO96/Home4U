package com.piko.home4u.controller;

import com.piko.home4u.service.NaverMapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/naver-map")
@RequiredArgsConstructor
public class NaverMapController {
    private final NaverMapService naverMapService;

    // ✅ 주소 → 좌표 변환 API
    @GetMapping("/geocode")
    public ResponseEntity<Map<String, Double>> getCoordinates(@RequestParam String address) {
        return ResponseEntity.ok(naverMapService.getCoordinates(address));
    }

    // ✅ 좌표 → 주소 변환 API
    @GetMapping("/reverse-geocode")
    public ResponseEntity<String> getAddress(@RequestParam double latitude, @RequestParam double longitude) {
        return ResponseEntity.ok(naverMapService.getAddress(latitude, longitude));
    }
}