package com.piko.home4u.worker;

import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.repository.SavedSearchRepository;
import com.piko.home4u.service.PushService;
import com.piko.home4u.service.SavedSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /** 1분 heartbeat — 워커가 살아있는지 확인. */
    @Scheduled(fixedRate = 60_000L)
    public void heartbeat() {
        log.debug("[worker] heartbeat at {}", LocalDateTime.now());
    }

    /**
     * 5분 주기 저장된 검색 알림.
     * 마지막 알림 시각 이후 매칭된 신규 매물이 있는 사용자에게 1건 푸시.
     */
    @Scheduled(fixedRate = 5L * 60_000L)
    public void notifySavedSearchMatches() {
        List<SavedSearch> all = savedSearchRepository.findAll();
        for (SavedSearch s : all) {
            try {
                int hits = savedSearchService.runMatch(s.getId()).size();
                if (hits == 0) continue;
                // 마지막 알림 후 5분 이상 경과한 경우만 푸시 (중복 노이즈 방지).
                LocalDateTime last = s.getLastNotifiedAt();
                if (last != null && ChronoUnit.MINUTES.between(last, LocalDateTime.now()) < 5) continue;
                if (pushService != null && s.getUser() != null) {
                    pushService.sendToUser(s.getUser().getId(),
                            "저장된 검색 \"" + s.getName() + "\"",
                            "조건에 맞는 매물 " + hits + "건이 등록되어 있어요.",
                            Map.of("type", "saved-search", "savedSearchId", s.getId()));
                }
                s.setLastNotifiedAt(LocalDateTime.now());
                savedSearchRepository.save(s);
            } catch (Exception ex) {
                log.warn("[worker] saved-search {} 알림 실패: {}", s.getId(), ex.getMessage());
            }
        }
    }
}
