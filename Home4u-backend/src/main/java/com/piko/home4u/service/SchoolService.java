package com.piko.home4u.service;

import com.piko.home4u.model.School;
import com.piko.home4u.repository.SchoolRepository;
import com.piko.home4u.util.GeoDistance;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolService {
    private final SchoolRepository schoolRepository;

    /**
     * 좌표를 기준으로 radiusMeters 이내의 학교를 가까운 순으로 반환.
     * H2 JPQL 의 acos/sin/cos 호환성 이슈를 피해 in-memory 필터링으로 단순 구현.
     */
    public List<NearbySchool> findNearby(double lat, double lng, int radiusMeters, int limit) {
        int cappedRadius = Math.max(100, Math.min(radiusMeters, 5000));
        int cappedLimit = Math.max(1, Math.min(limit, 30));

        return schoolRepository.findAll().stream()
                .map(s -> new NearbySchool(s, GeoDistance.meters(lat, lng, s.getLatitude(), s.getLongitude())))
                .filter(n -> n.getDistanceMeters() <= cappedRadius)
                .sorted(Comparator.comparingDouble(NearbySchool::getDistanceMeters))
                .limit(cappedLimit)
                .toList();
    }

    @Getter
    public static class NearbySchool {
        private final School school;
        private final double distanceMeters;
        private final int walkingMinutes;

        public NearbySchool(School school, double distanceMeters) {
            this.school = school;
            this.distanceMeters = Math.round(distanceMeters);
            this.walkingMinutes = GeoDistance.walkingMinutes(distanceMeters);
        }
    }
}
