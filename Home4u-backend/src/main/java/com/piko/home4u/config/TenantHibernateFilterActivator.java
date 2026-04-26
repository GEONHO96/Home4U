package com.piko.home4u.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

/**
 * Hibernate `tenantFilter` 를 서비스 진입 시점마다 enable 하는 AOP.
 *
 * - HandlerInterceptor 에서 enable 하면 Spring Data JPA 가 사용하는 Session 과 다른 인스턴스가
 *   잡히는 케이스가 있어, @Service 메서드 진입 시점에 항상 filter 를 켠다.
 * - TenantContext.currentTenantId() 가 null (단위 테스트 등) 이면 skip.
 * - 같은 트랜잭션 안에서 enableFilter 가 여러 번 호출돼도 Hibernate 가 같은 Filter 인스턴스를
 *   반환하므로 멱등.
 */
@Slf4j
@Aspect
@Component
public class TenantHibernateFilterActivator {

    public static final String FILTER_NAME = "tenantFilter";

    @PersistenceContext
    private EntityManager em;

    /**
     * 서비스 + 보안(JWT/UserDetails) 진입점을 모두 감싸 Hibernate filter 를 활성화한다.
     * - service..* : 일반 비즈니스 로직 — 매물/거래/리뷰 등
     * - security..* : JWT 검증·UserDetails 조회 (cross-tenant 토큰 사용 차단)
     */
    @Around("execution(* com.piko.home4u.service..*(..)) || execution(* com.piko.home4u.security..*(..))")
    public Object enableTenantFilter(ProceedingJoinPoint pjp) throws Throwable {
        Long tenantId = TenantContext.currentTenantId();
        if (tenantId == null) {
            return pjp.proceed();
        }
        try {
            Session session = em.unwrap(Session.class);
            Filter f = session.enableFilter(FILTER_NAME);
            f.setParameter("tenantId", tenantId);
            log.debug("[tenant-filter] activated tenantId={} for {}", tenantId, pjp.getSignature().toShortString());
        } catch (Exception ex) {
            log.warn("[tenant-filter] activation failed at {}: {}", pjp.getSignature().toShortString(), ex.getMessage());
        }
        return pjp.proceed();
    }
}
