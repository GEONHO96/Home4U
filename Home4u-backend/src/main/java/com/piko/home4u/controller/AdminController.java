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

import java.util.List;
import java.util.Map;

/**
 * 운영자 콘솔. SecurityConfig 에서 `/admin/**` 는 ROLE_ADMIN 만 허용.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final PropertyService propertyService;
    private final AdminMetricsService adminMetricsService;

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

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<Map<String, Object>> deleteProperty(@PathVariable Long id) {
        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Map.of("propertyId", id, "message", "매물 삭제 성공"));
    }

    @GetMapping("/metrics/properties-per-day")
    public ResponseEntity<List<AdminMetricsService.Bucket>> propertiesPerDay(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminMetricsService.propertiesPerDay(days));
    }

    @GetMapping("/metrics/transactions-per-day")
    public ResponseEntity<List<AdminMetricsService.Bucket>> transactionsPerDay(@RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminMetricsService.transactionsPerDay(days));
    }

    @GetMapping("/metrics/price-distribution")
    public ResponseEntity<Map<String, Long>> priceDistribution() {
        return ResponseEntity.ok(adminMetricsService.priceDistribution());
    }
}
