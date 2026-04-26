package com.piko.home4u.config;

import com.piko.home4u.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 모든 요청에서 `X-Tenant-Slug` 헤더 → 등록된 활성 테넌트로 매핑한다.
 * 헤더가 없거나 알 수 없는 슬러그면 `default` 로 처리하고, 정지된 테넌트는 403.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Tenant-Slug";
    public static final String DEFAULT_SLUG = "default";

    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String slug = headerOrDefault(request);
        var tenant = tenantRepository.findBySlug(slug);
        if (tenant.isEmpty() && !DEFAULT_SLUG.equals(slug)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "unknown tenant: " + slug);
            return;
        }
        if (tenant.isPresent() && !tenant.get().isActive()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "tenant suspended: " + slug);
            return;
        }
        Long tenantId = tenant.map(t -> t.getId()).orElse(null);
        TenantContext.set(slug, tenantId);
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private static String headerOrDefault(HttpServletRequest req) {
        String h = req.getHeader(HEADER);
        if (h == null || h.isBlank()) return DEFAULT_SLUG;
        return h.trim().toLowerCase();
    }
}
