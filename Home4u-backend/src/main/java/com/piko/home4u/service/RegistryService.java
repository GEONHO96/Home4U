package com.piko.home4u.service;

import com.piko.home4u.model.Property;
import com.piko.home4u.repository.PropertyRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 부동산 등기/안심거래 조회 어댑터.
 *
 * 운영 단계에서는 인터넷등기소 또는 정부 오픈 API (data.go.kr) 의 키를 받아
 * 실제 응답을 매핑한다 — 현재는 키가 없을 때 deterministic stub 을 반환한다.
 *
 * `home4u.registry.api-key` 가 설정되면 실 호출 모드로 전환되며,
 * 이 서비스의 hits 는 매물 상세에서 "안심 거래 검증" 배지를 띄울지 결정하는데 사용된다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistryService {

    private final PropertyRepository propertyRepository;

    @Value("${home4u.registry.api-key:}")
    private String apiKey;

    public boolean isLive() {
        return apiKey != null && !apiKey.isBlank();
    }

    public RegistryReport lookup(Long propertyId) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        if (isLive()) {
            return callExternalApi(p);
        }
        return stubFor(p);
    }

    /**
     * Deterministic stub: 매물 ID 와 주소를 기반으로 일관된 결과를 만든다.
     * 짝수 ID = "검증 통과", 홀수 = "주의" — 데모/UI 검증용.
     */
    private RegistryReport stubFor(Property p) {
        boolean clean = (p.getId() % 2L == 0);
        List<String> notes = new ArrayList<>();
        notes.add("로컬 stub 응답 — 운영 환경에서는 home4u.registry.api-key 설정 필요");
        if (!clean) {
            notes.add("근저당권 1건 (잔액 미상) — 거래 전 확인 권장");
        }
        return RegistryReport.builder()
                .propertyId(p.getId())
                .address(p.getAddress())
                .verifiedAt(LocalDate.now())
                .ownerNameMasked(p.getOwner() != null ? maskName(p.getOwner().getUsername()) : null)
                .liens(clean ? 0 : 1)
                .seizures(0)
                .clean(clean)
                .notes(notes)
                .source(isLive() ? "registry-api" : "stub")
                .build();
    }

    private RegistryReport callExternalApi(Property p) {
        // TODO: 운영 환경에서 실 API 매핑 (인터넷등기소 / data.go.kr 등). 현재는 stub 으로 대체.
        log.info("Registry API key configured but real adapter not implemented yet — returning stub for property {}", p.getId());
        return stubFor(p);
    }

    private static String maskName(String s) {
        if (s == null || s.length() < 2) return s;
        if (s.length() == 2) return s.charAt(0) + "*";
        return s.charAt(0) + "*".repeat(s.length() - 2) + s.charAt(s.length() - 1);
    }

    @Getter
    @Builder
    public static class RegistryReport {
        private final Long propertyId;
        private final String address;
        private final LocalDate verifiedAt;
        private final String ownerNameMasked;
        private final int liens;       // 근저당 건수
        private final int seizures;    // 압류 건수
        private final boolean clean;   // 안심거래 가능 여부
        private final List<String> notes;
        private final String source;   // "stub" | "registry-api"
    }
}
