package com.piko.home4u.service;

import com.piko.home4u.dto.OAuthTokenResponse;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.UserRepository;
import com.piko.home4u.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OAuthService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    // ✅ Google 로그인
    public OAuthTokenResponse googleLogin(String code) {
        Map<String, Object> userInfo = getUserInfoFromOAuth("https://oauth2.googleapis.com/token", code);
        return processOAuthLogin(userInfo, "google");
    }

    // ✅ Kakao 로그인
    public OAuthTokenResponse kakaoLogin(String code) {
        Map<String, Object> userInfo = getUserInfoFromOAuth("https://kauth.kakao.com/oauth/token", code);
        return processOAuthLogin(userInfo, "kakao");
    }

    // ✅ Naver 로그인
    public OAuthTokenResponse naverLogin(String code) {
        Map<String, Object> userInfo = getUserInfoFromOAuth("https://nid.naver.com/oauth2.0/token", code);
        return processOAuthLogin(userInfo, "naver");
    }

    // ✅ OAuth 제공자로부터 사용자 정보 가져오기
    private Map<String, Object> getUserInfoFromOAuth(String tokenUrl, String code) {
        ResponseEntity<Map> response = restTemplate.exchange(
                tokenUrl,
                HttpMethod.POST,
                new HttpEntity<>(null, new HttpHeaders()),
                Map.class
        );
        return response.getBody();
    }

    // ✅ OAuth 사용자 처리
    private OAuthTokenResponse processOAuthLogin(Map<String, Object> userInfo, String provider) {
        String email = (String) userInfo.get("email");

        Optional<User> existingUser = userRepository.findByUsername(email);
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = new User(email, passwordEncoder.encode("oauth_user"), email, "", UserRole.ROLE_USER);
            userRepository.save(user);
        }

        String token = jwtTokenProvider.createToken(user.getUsername());
        return new OAuthTokenResponse(token, provider);
    }
}