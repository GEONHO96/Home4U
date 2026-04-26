package com.piko.home4u.security;

import com.piko.home4u.model.User;
import com.piko.home4u.repository.UserRepository;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Collections;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:3600000}")
    private long validityInMilliseconds;

    private final UserRepository userRepository;
    private Key key;

    public JwtTokenProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    protected void init() {
        key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + validityInMilliseconds))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        }
        return false;
    }

    public String getUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public Authentication getAuthentication(String token) {
        String username = getUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new io.jsonwebtoken.JwtException(
                        "토큰의 사용자(" + username + ") 를 찾을 수 없습니다."));

        // 멀티테넌시: 토큰의 사용자 tenant 가 현재 요청 tenant 와 일치해야 한다.
        // (Hibernate @Filter 가 derived 메서드에 항상 적용되지 않을 수 있어 명시 비교)
        Long ctxTenantId = com.piko.home4u.config.TenantContext.currentTenantId();
        Long userTenantId = user.getTenant() != null ? user.getTenant().getId() : null;
        if (ctxTenantId != null && userTenantId != null && !ctxTenantId.equals(userTenantId)) {
            throw new io.jsonwebtoken.JwtException(
                    "토큰의 테넌트(" + userTenantId + ")가 요청 테넌트(" + ctxTenantId + ")와 다릅니다.");
        }

        return new UsernamePasswordAuthenticationToken(
                username,
                "",
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
