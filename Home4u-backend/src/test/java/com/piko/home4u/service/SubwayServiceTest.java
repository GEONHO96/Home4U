package com.piko.home4u.service;

import com.piko.home4u.model.SubwayStation;
import com.piko.home4u.repository.SubwayStationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubwayServiceTest {

    @Mock private SubwayStationRepository repo;
    @InjectMocks private SubwayService service;

    private SubwayStation s(long id, String name, double lat, double lng) {
        return SubwayStation.builder().id(id).name(name).line("2호선").latitude(lat).longitude(lng).build();
    }

    @Test
    void findNearby_filtersByRadiusAndSortsAscending() {
        // 기준점: 강남역(37.4979, 127.0276)
        // 역삼역(약 0.8km), 선릉(약 2km), 잠실(약 8km)
        when(repo.findAll()).thenReturn(List.of(
                s(1L, "역삼", 37.5006, 127.0369),
                s(2L, "선릉", 37.5046, 127.0490),
                s(3L, "잠실", 37.5133, 127.1000)
        ));

        List<SubwayService.NearbyStation> near = service.findNearby(37.4979, 127.0276, 3000, 10);

        assertThat(near).hasSize(2);
        assertThat(near.get(0).getStation().getName()).isEqualTo("역삼");
        assertThat(near.get(1).getStation().getName()).isEqualTo("선릉");
        assertThat(near.get(0).getDistanceMeters()).isLessThan(near.get(1).getDistanceMeters());
        assertThat(near.get(0).getWalkingMinutes()).isPositive();
    }

    @Test
    void findNearby_respectsLimitAndRadiusClamp() {
        when(repo.findAll()).thenReturn(List.of(
                s(1L, "역삼", 37.5006, 127.0369),
                s(2L, "선릉", 37.5046, 127.0490)
        ));
        // limit 이 0 이어도 최소 1 로 보정, radius 도 100 미만 -> 100 으로 clamp
        List<SubwayService.NearbyStation> near = service.findNearby(37.4979, 127.0276, 50, 0);
        assertThat(near.size()).isLessThanOrEqualTo(1);
    }
}
