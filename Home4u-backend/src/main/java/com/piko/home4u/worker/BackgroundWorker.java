package com.piko.home4u.worker;

import com.piko.home4u.config.TenantContext;
import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.repository.SavedSearchRepository;
import com.piko.home4u.service.PushService;
import com.piko.home4u.service.SavedSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * 비동기 워커. 외부 큐 인프라(RabbitMQ/Kafka) 없이 Spring 의 @Scheduled 로
 * 주기 작업을 돌린다. 같은 JVM 안에서만 동작하므로 멀티-인스턴스 운영 시에는
 * ShedLock 등으로 단일 실행 보장이 필요하다.
 *
 * 현재 잡:
 *  1) 저장된 검색 매칭 알림 — 5분 주기로 새 매물이 매칭되면 사용자에게 푸시
 *  2) 헬스 핑 로그 — 디버깅용 1분 heartbeat
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BackgroundWorker {

    private final SavedSearchRepository savedSearchRepository;
    private final SavedSearchService savedSearchService;

    @Autowired(required = false)
    private PushService pushService;

    /** 1분 heartbeat — 워커가 살아있는지 확인. ShedLock 으로 멀티 인스턴스에서 한 번만 실행. */
    @Scheduled(fixedRate = 60_000L)
    @SchedulerLock(name = "BackgroundWorker.heartbeat", lockAtMostFor = "PT50S", lockAtLeastFor = "PT30S")
    public void heartbeat() {
        log.debug("[worker] heartbeat at {}", LocalDateTime.now());
    }

    /**
     * 5분 주기 저장된 검색 알림.
     *
     * 워커는 백그라운드 스레드라 TenantContext 가 비어 있다. 두 단계로 안전하게 다룬다:
     *  1) 저장된 검색 목록 자체는 모든 테넌트에서 가져와야 하므로 runAsAllTenants 로 명시적으로
     *     필터를 끈 상태로 fetch — 의도된 cross-tenant scan.
     *  2) 각 SavedSearch 의 매칭 + 알림은 해당 사용자의 테넌트 안에서 평가해야 하므로
     *     runForTenant 로 임시 스코프 후 savedSearchService.runMatch 호출 — Hibernate filter 가
     *     :tenantId 로 좁혀져 다른 테넌트 매물이 매칭에 섞이지 않는다.
     */
    @Scheduled(fixedRate = 5L * 60_000L)
    @SchedulerLock(name = "BackgroundWorker.notifySavedSearchMatches", lockAtMostFor = "PT4M", lockAtLeastFor = "PT4M")
    public void notifySavedSearchMatches() {
        List<SavedSearch> all = TenantContext.runAsAllTenants(savedSearchRepository::findAll);
        for (SavedSearch s : all) {
            if (s.getTenant() == null || s.getUser() == null) continue;
            try {
                final SavedSearch search = s;
                int hits = TenantContext.runForTenant(
                        search.getTenant().getSlug(), search.getTenant().getId(),
                        () -> savedSearchService.runMatch(search.getId()).size());
                if (hits == 0) continue;

                LocalDateTime last = s.getLastNotifiedAt();
                if (last != null && ChronoUnit.MINUTES.between(last, LocalDateTime.now()) < 5) continue;
                if (pushService != null) {
                    pushService.sendToUser(s.getUser().getId(),
                            "저장된 검색 \"" + s.getName() + "\"",
                            "조건에 맞는 매물 " + hits + "건이 등록되어 있어요.",
                            Map.of("type", "saved-search", "savedSearchId", s.getId()));
                }
                s.setLastNotifiedAt(LocalDateTime.now());
                TenantContext.runAsAllTenants(() -> savedSearchRepository.save(search));
            } catch (Exception ex) {
                log.warn("[worker] saved-search {} 알림 실패: {}", s.getId(), ex.getMessage());
            }
        }
    }
}
