package com.piko.home4u.service;

import com.piko.home4u.model.SubwayStation;
import com.piko.home4u.repository.SubwayStationRepository;
import com.piko.home4u.util.GeoDistance;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubwayService {
    private final SubwayStationRepository repository;

    /**
     * 주어진 좌표로부터 radiusMeters 이내의 역을 가까운 순으로 반환.
     * 각 엔트리에 거리(m) / 도보 분 / 역 정보가 포함됨.
     */
    public List<NearbyStation> findNearby(double lat, double lng, int radiusMeters, int limit) {
        int cappedLimit = Math.max(1, Math.min(limit, 20));
        int cappedRadius = Math.max(100, Math.min(radiusMeters, 5000));
        return repository.findAll().stream()
                .map(s -> new NearbyStation(s, GeoDistance.meters(lat, lng, s.getLatitude(), s.getLongitude())))
                .filter(n -> n.getDistanceMeters() <= cappedRadius)
                .sorted(Comparator.comparingDouble(NearbyStation::getDistanceMeters))
                .limit(cappedLimit)
                .toList();
    }

    @Getter
    public static class NearbyStation {
        private final SubwayStation station;
        private final double distanceMeters;
        private final int walkingMinutes;

        public NearbyStation(SubwayStation station, double distanceMeters) {
            this.station = station;
            this.distanceMeters = Math.round(distanceMeters);
            this.walkingMinutes = GeoDistance.walkingMinutes(distanceMeters);
        }
    }
}
