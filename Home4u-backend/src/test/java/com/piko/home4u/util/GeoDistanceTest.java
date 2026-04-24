package com.piko.home4u.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeoDistanceTest {

    @Test
    void samePoint_zero() {
        assertThat(GeoDistance.meters(37.5, 127.0, 37.5, 127.0)).isZero();
    }

    @Test
    void seoulStation_to_gangnam_is_roughly_8km() {
        // 서울역(37.5547, 126.9707) <-> 강남역(37.4979, 127.0276)
        double d = GeoDistance.meters(37.5547, 126.9707, 37.4979, 127.0276);
        assertThat(d / 1000.0).isCloseTo(8.2, within(1.0)); // 약 8.2km ± 1km
    }

    @Test
    void walkingMinutes_roundsUp() {
        assertThat(GeoDistance.walkingMinutes(0)).isZero();
        assertThat(GeoDistance.walkingMinutes(79)).isEqualTo(1);  // 80m/분 기준 올림
        assertThat(GeoDistance.walkingMinutes(80)).isEqualTo(1);
        assertThat(GeoDistance.walkingMinutes(81)).isEqualTo(2);
        assertThat(GeoDistance.walkingMinutes(800)).isEqualTo(10);
    }
}
