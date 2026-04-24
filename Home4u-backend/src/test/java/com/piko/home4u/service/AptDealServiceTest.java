package com.piko.home4u.service;

import com.piko.home4u.model.AptDeal;
import com.piko.home4u.repository.AptDealRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AptDealServiceTest {

    @Mock private AptDealRepository repo;
    @InjectMocks private AptDealService service;

    private AptDeal deal(String ym, int price) {
        return AptDeal.builder()
                .apartmentName("X").gungu("강남구").dong("역삼동")
                .dealYearMonth(ym).price(price).area(60.0).floor(5)
                .build();
    }

    @Test
    void monthlyAverage_groupsByYearMonth() {
        when(repo.findByApartmentNameOrderByDealYearMonthAsc("X"))
                .thenReturn(List.of(
                        deal("2026-01", 100_000),
                        deal("2026-01", 120_000),
                        deal("2026-02", 110_000)
                ));

        List<AptDealService.MonthlyAverage> result = service.monthlyAverage("X");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getDealYearMonth()).isEqualTo("2026-01");
        assertThat(result.get(0).getAveragePrice()).isEqualTo(110_000L);
        assertThat(result.get(0).getCount()).isEqualTo(2L);
        assertThat(result.get(1).getDealYearMonth()).isEqualTo("2026-02");
        assertThat(result.get(1).getAveragePrice()).isEqualTo(110_000L);
        assertThat(result.get(1).getCount()).isEqualTo(1L);
    }

    @Test
    void monthlyAverage_emptyApt_returnsEmptyList() {
        when(repo.findByApartmentNameOrderByDealYearMonthAsc("missing")).thenReturn(List.of());
        assertThat(service.monthlyAverage("missing")).isEmpty();
    }
}
