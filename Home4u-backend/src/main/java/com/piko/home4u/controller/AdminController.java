package com.piko.home4u.controller;

import com.piko.home4u.model.Property;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.User;
import com.piko.home4u.service.AdminMetricsService;
import com.piko.home4u.service.AdminService;
import com.piko.home4u.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

@Tag(name = "Admin", description = "운영자 전용 — ROLE_ADMIN 만 접근. 요약/사용자/매물/거래/신고/메트릭 + 매물 강제 삭제.")
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final PropertyService propertyService;
    private final AdminMetricsService adminMetricsService;

    @Operation(summary = "운영 요약", description = "총 사용자/매물/거래 + Role/Status 분포")
    @GetMapping("/summary")
    public ResponseEntity<AdminService.Summary> summary() {
        return ResponseEntity.ok(adminService.summary());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(adminService.listUsers());
    }

    @GetMapping("/properties")
    public ResponseEntity<Page<Property>> listProperties(Pageable pageable) {
        return ResponseEntity.ok(propertyService.getPagedProperties(pageable));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<Transaction>> listTransactions() {
        return ResponseEntity.ok(adminService.listTransactions());
    }

    @Operation(summary = "매물 강제 삭제", description = "운영자가 부적절 매물을 즉시 제거.")
    @DeleteMapping("/properties/{id}")
    public ResponseEntity<Map<String, Object>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("propertyId", id, "message", "매물 삭제 성공"));
    }

    @Operation(summary = "최근 N일 매물 등록 시계열")
    @GetMapping("/metrics/properties-per-day")
    public ResponseEntity<List<AdminMetricsService.Bucket>> propertiesPerDay(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminMetricsService.propertiesPerDay(days));
    }

    @Operation(summary = "최근 N일 거래 시계열")
    @GetMapping("/metrics/transactions-per-day")
    public ResponseEntity<List<AdminMetricsService.Bucket>> transactionsPerDay(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminMetricsService.transactionsPerDay(days));
    }

    @Operation(summary = "매물 가격대 분포", description = "5천만원 이하 / 1억 / 5억 / 10억 / 10억+")
    @GetMapping("/metrics/price-distribution")
    public ResponseEntity<Map<String, Long>> priceDistribution() {
        return ResponseEntity.ok(adminMetricsService.priceDistribution());
    }
}
