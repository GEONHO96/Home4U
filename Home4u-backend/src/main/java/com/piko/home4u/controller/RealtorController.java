package com.piko.home4u.controller;

import com.piko.home4u.dto.RealtorDto;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.service.RealtorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/realtors")
@RequiredArgsConstructor
public class RealtorController {
    private final RealtorService realtorService;

    // ✅ 특정 아파트의 공인중개사 목록 조회 API
    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<List<Realtor>> getRealtorsByApartment(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(realtorService.getRealtorsByApartment(apartmentId));
    }

    // ✅ 특정 공인중개사 이름으로 조회 API
    @GetMapping("/name")
    public ResponseEntity<List<Realtor>> getRealtorByName(@RequestParam String name) {
        return ResponseEntity.ok(realtorService.getRealtorByName(name));
    }

    // ✅ 특정 공인중개사 전화번호로 조회 API
    @GetMapping("/phone")
    public ResponseEntity<Realtor> getRealtorByPhoneNumber(@RequestParam String phoneNumber) {
        return ResponseEntity.ok(realtorService.getRealtorByPhoneNumber(phoneNumber));
    }

    // ✅ 특정 지역(구/군)의 공인중개사 목록 조회 API
    @GetMapping("/gungu")
    public ResponseEntity<List<Realtor>> getRealtorsByGungu(@RequestParam String gungu) {
        return ResponseEntity.ok(realtorService.getRealtorsByGungu(gungu));
    }

    // ✅ 특정 지역(구/군) 내 공인중개사 개수 조회 API
    @GetMapping("/gungu/count")
    public ResponseEntity<Long> countRealtorsGungu(@RequestParam String gungu) {
        return ResponseEntity.ok(realtorService.countRealtorsGungu(gungu));
    }

    // ✅ 중개업자 등록 (body 에 apartmentId 필수)
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody RealtorDto dto) {
        Realtor saved = realtorService.createRealtor(dto);
        return ResponseEntity.ok(Map.of(
                "message", "중개업자 등록 성공",
                "realtorId", saved.getId()
        ));
    }

    // ✅ 중개업자 수정
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable Long id, @RequestBody RealtorDto dto) {
        Realtor updated = realtorService.updateRealtor(id, dto);
        return ResponseEntity.ok(Map.of(
                "message", "중개업자 수정 성공",
                "realtorId", updated.getId()
        ));
    }

    // ✅ 중개업자 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        realtorService.deleteRealtor(id);
        return ResponseEntity.ok(Map.of("message", "중개업자 삭제 성공"));
    }
}
