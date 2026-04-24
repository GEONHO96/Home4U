package com.piko.home4u.controller;

import com.piko.home4u.service.SubwayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/subway")
@RequiredArgsConstructor
public class SubwayController {
    private final SubwayService subwayService;

    /**
     * GET /subway/nearby?lat=37.5&lng=127.0&radius=1000&limit=5
     * radius (m) 기본 1000, 최대 5000 / limit 기본 5, 최대 20
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<SubwayService.NearbyStation>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "1000") int radius,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(subwayService.findNearby(lat, lng, radius, limit));
    }
}
