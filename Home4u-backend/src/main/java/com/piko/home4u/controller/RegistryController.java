package com.piko.home4u.controller;

import com.piko.home4u.service.RegistryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Registry / 안심거래", description = "등기부 검증 어댑터. home4u.registry.api-key 미설정 시 deterministic stub.")
@RestController
@RequestMapping("/registry")
@RequiredArgsConstructor
public class RegistryController {

    private final RegistryService registryService;

    /**
     * 매물의 등기/안심거래 검증 결과 조회.
     * dev 환경에서는 deterministic stub 을 반환한다 — 짝수 ID = clean, 홀수 = 주의.
     */
    @GetMapping("/properties/{propertyId}")
    public ResponseEntity<RegistryService.RegistryReport> lookup(@PathVariable Long propertyId) {
        return ResponseEntity.ok(registryService.lookup(propertyId));
    }
}
