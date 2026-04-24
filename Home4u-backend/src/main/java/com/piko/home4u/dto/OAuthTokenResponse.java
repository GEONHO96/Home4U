package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 소셜 로그인 성공 응답. 일반 로그인과 같은 필드 (token/userId/username/role) 를 반환해
 * 프론트가 동일한 localStorage 세팅 로직을 쓸 수 있다. provider 는 UX 용 부가 정보.
 */
@Getter
@Builder
@AllArgsConstructor
public class OAuthTokenResponse {
    private String token;
    private Long userId;
    private String username;
    private String role;
    private String provider;
}
