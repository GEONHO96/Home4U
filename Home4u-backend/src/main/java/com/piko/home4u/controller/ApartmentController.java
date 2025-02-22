package com.piko.home4u.controller;

import com.piko.home4u.model.Apartment;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.model.School;
import com.piko.home4u.service.ApartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/apartments")
@RequiredArgsConstructor
public class ApartmentController {
    private final ApartmentService apartmentService;

    // ✅ 아파트 상세 정보 표현
    @GetMapping("/{name}")
    public ResponseEntity<?> getApartmentDetails(@PathVariable String name) {
        Optional<Apartment> apartment = apartmentService.getApartmentDetails(name);
        return apartment.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ 해당 아파트의 공인중개사 목록 조회
    @GetMapping("/{apartmentId}/relators")
    public ResponseEntity<List<Realtor>> getRelators(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(apartmentService.getRealtorsForApartment(apartmentId));
    }

    // ✅ 해당 아파트 주변 학교 목록 조회
    @GetMapping("/{apartmentId}/schools")
    public ResponseEntity<List<School>> getSchools(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(apartmentService.getSchoolsForApartment(apartmentId));
    }
}