package com.piko.home4u.util;

/**
 * 지구 곡률을 반영한 두 위경도 간 거리(미터) — Haversine 공식.
 */
public final class GeoDistance {
    private GeoDistance() {}

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    /** 두 좌표의 직선 거리(미터). */
    public static double meters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /** 직선 거리 기반 도보 분(평균 속도 80m/분 = 약 4.8km/h). */
    public static int walkingMinutes(double meters) {
        if (meters <= 0) return 0;
        return (int) Math.ceil(meters / 80.0);
    }
}
