package com.piko.home4u.controller;

import com.piko.home4u.model.AptDeal;
import com.piko.home4u.service.AptDealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/apt-deals")
@RequiredArgsConstructor
public class AptDealController {
    private final AptDealService service;

    /** 특정 아파트의 전체 거래 (오름차순 연월). */
    @GetMapping
    public ResponseEntity<List<AptDeal>> byApartment(@RequestParam String apartmentName) {
        return ResponseEntity.ok(service.findByApartmentName(apartmentName));
    }

    /** 특정 구(gungu)의 전체 거래 */
    @GetMapping("/gungu")
    public ResponseEntity<List<AptDeal>> byGungu(@RequestParam String gungu) {
        return ResponseEntity.ok(service.findByGungu(gungu));
    }

    /** 연월별 평균 거래가 (차트용). */
    @GetMapping("/monthly")
    public ResponseEntity<List<AptDealService.MonthlyAverage>> monthly(
            @RequestParam String apartmentName) {
        return ResponseEntity.ok(service.monthlyAverage(apartmentName));
    }
}
