package com.piko.home4u.service;

import com.piko.home4u.model.Property;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 대시보드용 시계열 / 분포 메트릭.
 * Property 는 등록일이 별도 컬럼이 없으니 ID 순서로 N일치 슬롯에 채우고,
 * Transaction 은 date 컬럼 (LocalDate) 을 기준으로 day-bucket 한다.
 */
@Service
@RequiredArgsConstructor
public class AdminMetricsService {

    private final PropertyRepository propertyRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<Bucket> propertiesPerDay(int days) {
        int safe = Math.max(1, Math.min(days, 90));
        LocalDate from = LocalDate.now().minusDays(safe - 1L);
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 0; i < safe; i++) counts.put(from.plusDays(i), 0L);

        // Property 엔티티에 createdAt 이 없으므로 id 의 균등 분포로 분배 — 데모용.
        List<Property> all = propertyRepository.findAll();
        if (!all.isEmpty()) {
            int per = Math.max(1, all.size() / safe);
            int idx = 0;
            for (Property ignored : all) {
                LocalDate slot = from.plusDays(Math.min(idx / per, safe - 1));
                counts.merge(slot, 1L, Long::sum);
                idx++;
            }
        }
        return toBuckets(counts);
    }

    @Transactional(readOnly = true)
    public List<Bucket> transactionsPerDay(int days) {
        int safe = Math.max(1, Math.min(days, 90));
        LocalDate from = LocalDate.now().minusDays(safe - 1L);
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (int i = 0; i < safe; i++) counts.put(from.plusDays(i), 0L);

        for (Transaction tx : transactionRepository.findAll()) {
            LocalDate d = tx.getDate();
            if (d != null && !d.isBefore(from) && !d.isAfter(LocalDate.now())) {
                counts.merge(d, 1L, Long::sum);
            }
        }
        return toBuckets(counts);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> priceDistribution() {
        // 만원 단위 → 가격대 분포
        Map<String, Long> bands = new LinkedHashMap<>();
        bands.put("~5천", 0L);
        bands.put("5천~1억", 0L);
        bands.put("1억~5억", 0L);
        bands.put("5억~10억", 0L);
        bands.put("10억+", 0L);
        for (Property p : propertyRepository.findAll()) {
            long w = p.getPrice();
            String key;
            if (w < 5000) key = "~5천";
            else if (w < 10000) key = "5천~1억";
            else if (w < 50000) key = "1억~5억";
            else if (w < 100000) key = "5억~10억";
            else key = "10억+";
            bands.merge(key, 1L, Long::sum);
        }
        return bands;
    }

    private List<Bucket> toBuckets(Map<LocalDate, Long> counts) {
        return counts.entrySet().stream()
                .map(e -> Bucket.builder().date(e.getKey().toString()).count(e.getValue()).build())
                .toList();
    }

    @Getter
    @Builder
    public static class Bucket {
        private final String date;
        private final long count;
    }
}
