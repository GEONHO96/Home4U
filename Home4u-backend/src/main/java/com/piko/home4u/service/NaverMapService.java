package com.piko.home4u.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NaverMapService {

    @Value("${naver.client.id}")
    private String clientId;

    @Value("${naver.client.secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    // ✅ 주소 → 좌표 변환 (Geocoding API)
    public Map<String, Double> getCoordinates(String address) {
        String url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=" + address;

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
        headers.set("X-NCP-APIGW-API-KEY", clientSecret);

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> result = (Map<String, Object>) response.getBody().get("addresses");

            if (result != null && !result.isEmpty()) {
                Map<String, Double> coordinates = new HashMap<>();
                coordinates.put("latitude", Double.parseDouble(result.get("y").toString()));
                coordinates.put("longitude", Double.parseDouble(result.get("x").toString()));
                return coordinates;
            }
        }
        return null;
    }

    // ✅ 좌표 → 주소 변환 (Reverse Geocoding API) (오류 수정)
    public String getAddress(double latitude, double longitude) {
        String url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?"
                + "coords=" + longitude + "," + latitude + "&output=json";

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
        headers.set("X-NCP-APIGW-API-KEY", clientSecret);

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> results = (Map<String, Object>) response.getBody().get("results");

            if (results != null && !results.isEmpty()) {
                Map<String, Object> region = (Map<String, Object>) results.get("region");
                return region.get("area1").toString() + " " +
                        region.get("area2").toString() + " " +
                        region.get("area3").toString();
            }
        }
        return "주소를 찾을 수 없습니다.";
    }
}
