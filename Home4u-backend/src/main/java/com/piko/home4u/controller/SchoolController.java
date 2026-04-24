package com.piko.home4u.controller;

import com.piko.home4u.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/schools")
@RequiredArgsConstructor
public class SchoolController {
    private final SchoolService schoolService;

    /**
     * GET /schools/nearby?lat=37.5&lng=127.0&radius=1500&limit=10
     * radius 기본 1500m · 최대 5000m · limit 기본 10 · 최대 30
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<SchoolService.NearbySchool>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1500") int radius,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(schoolService.findNearby(lat, lng, radius, limit));
    }
}
