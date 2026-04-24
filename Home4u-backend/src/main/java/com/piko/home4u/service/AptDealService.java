package com.piko.home4u.service;

import com.piko.home4u.model.AptDeal;
import com.piko.home4u.repository.AptDealRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AptDealService {
    private final AptDealRepository repository;

    public List<AptDeal> findByApartmentName(String name) {
        return repository.findByApartmentNameOrderByDealYearMonthAsc(name);
    }

    public List<AptDeal> findByGungu(String gungu) {
        return repository.findByGunguOrderByDealYearMonthAsc(gungu);
    }

    /**
     * 연월 단위로 평균 거래가 시계열을 만든다. 차트 데이터 포맷에 가까운 레코드 리스트.
     */
    public List<MonthlyAverage> monthlyAverage(String apartmentName) {
        List<AptDeal> deals = findByApartmentName(apartmentName);
        Map<String, long[]> acc = new LinkedHashMap<>();    // [sum, count]
        for (AptDeal d : deals) {
            long[] v = acc.computeIfAbsent(d.getDealYearMonth(), k -> new long[2]);
            v[0] += d.getPrice();
            v[1]++;
        }
        List<MonthlyAverage> out = new ArrayList<>(acc.size());
        acc.forEach((ym, v) -> out.add(new MonthlyAverage(ym, Math.round((double) v[0] / v[1]), v[1])));
        return out;
    }

    @Getter
    public static class MonthlyAverage {
        private final String dealYearMonth;
        private final long averagePrice; // 만원
        private final long count;

        public MonthlyAverage(String dealYearMonth, long averagePrice, long count) {
            this.dealYearMonth = dealYearMonth;
            this.averagePrice = averagePrice;
            this.count = count;
        }
    }
}
