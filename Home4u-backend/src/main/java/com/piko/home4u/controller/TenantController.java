package com.piko.home4u.controller;

import com.piko.home4u.config.TenantContext;
import com.piko.home4u.config.TenantFilter;
import com.piko.home4u.model.Tenant;
import com.piko.home4u.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantRepository tenantRepository;

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> current() {
        String slug = TenantContext.currentSlug();
        if (slug == null) slug = TenantFilter.DEFAULT_SLUG;
        var tenant = tenantRepository.findBySlug(slug);
        return ResponseEntity.ok(Map.of(
                "slug", slug,
                "active", tenant.map(Tenant::isActive).orElse(true),
                "name", tenant.map(Tenant::getName).orElse("Default")
        ));
    }

    @GetMapping
    public ResponseEntity<List<Tenant>> list() {
        return ResponseEntity.ok(tenantRepository.findAll());
    }
}
