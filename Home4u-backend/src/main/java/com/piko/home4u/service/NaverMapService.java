package com.piko.home4u.service;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class NaverMapService {

    private final String clientId;
    private final String clientSecret;
    private final RestTemplate restTemplate;

    // ✅ 환경 변수 및 application.properties 값 설정
    public NaverMapService(RestTemplate restTemplate,
                           @Value("${naver.client.id:}") String clientIdProp,
                           @Value("${naver.client.secret:}") String clientSecretProp) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        this.clientId = Optional.ofNullable(dotenv.get("NAVER_CLIENT_ID")).orElse(clientIdProp);
        this.clientSecret = Optional.ofNullable(dotenv.get("NAVER_CLIENT_SECRET")).orElse(clientSecretProp);
        this.restTemplate = restTemplate;
    }

    // ✅ 주소 → 좌표 변환 (Geocoding API)
    public Map<String, Double> getCoordinates(String address) {
        String url = "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=" + address;

        HttpHeaders headers = createHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, new ParameterizedTypeReference<>() {});

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return extractCoordinates(response.getBody());
        }

        log.warn("주소 변환 실패: {}", address);
        return Collections.emptyMap();
    }

    // ✅ 좌표 → 주소 변환 (Reverse Geocoding API)
    public String getAddress(double latitude, double longitude) {
        String url = "https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=" + longitude + "," + latitude + "&output=json";

        HttpHeaders headers = createHeaders();
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, entity, new ParameterizedTypeReference<>() {});

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            return extractAddress(response.getBody());
        }

        log.warn("좌표 변환 실패: ({}, {})", latitude, longitude);
        return "주소를 찾을 수 없습니다.";
    }

    // ✅ 공통 헤더 생성
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
        headers.set("X-NCP-APIGW-API-KEY", clientSecret);
        return headers;
    }

    // ✅ 좌표 추출 메서드 (주소 → 좌표 변환)
    private Map<String, Double> extractCoordinates(Map<String, Object> responseBody) {
        List<Map<String, Object>> addresses = (List<Map<String, Object>>) responseBody.get("addresses");

        if (addresses != null && !addresses.isEmpty()) {
            Map<String, Object> result = addresses.get(0);
            Map<String, Double> coordinates = new HashMap<>();
            coordinates.put("latitude", Double.parseDouble(result.get("y").toString()));
            coordinates.put("longitude", Double.parseDouble(result.get("x").toString()));
            return coordinates;
        }

        log.warn("좌표 데이터 없음: {}", responseBody);
        return Collections.emptyMap();
    }

    // ✅ 주소 추출 메서드 (좌표 → 주소 변환)
    private String extractAddress(Map<String, Object> responseBody) {
        List<Map<String, Object>> results = (List<Map<String, Object>>) responseBody.get("results");

        if (results != null && !results.isEmpty()) {
            Map<String, Object> region = (Map<String, Object>) results.get(0).get("region");
            return region.get("area1") + " " + region.get("area2") + " " + region.get("area3");
        }

        log.warn("주소 데이터 없음: {}", responseBody);
        return "주소를 찾을 수 없습니다.";
    }
}
