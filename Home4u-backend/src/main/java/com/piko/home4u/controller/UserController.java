package com.piko.home4u.controller;

import com.piko.home4u.dto.LoginDto;
import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.service.PropertyService;
import com.piko.home4u.service.UserService;
import com.piko.home4u.service.UserStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Tag(name = "Users", description = "회원가입 / 로그인 / 사용자 검색 / 중개사 신뢰도 지표")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final PropertyService propertyService;
    private final UserStatsService userStatsService;

    @Operation(summary = "회원가입", description = "ROLE_USER (일반) 또는 ROLE_REALTOR (중개사). REALTOR 는 licenseNumber/agencyName 추가.")
    @SecurityRequirements // public
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserSignupDto userSignupDto) {
        userService.registerUser(userSignupDto);
        return ResponseEntity.ok(Map.of("message", "회원 가입 성공"));
    }

    @Operation(summary = "로그인 (JWT 발급)", description = "응답으로 token/userId/username/role 을 받아 프론트가 후속 요청에 사용한다.")
    @SecurityRequirements // public
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        String token = userService.login(loginDto.getUsername(), loginDto.getPassword());
        User user = userService.getUserByUsername(loginDto.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole().name()
        ));
    }

    // ✅ 회원탈퇴 API (JWT 토큰을 통해 본인 확인 후 계정 삭제)
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteUser(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        String username = userService.getUsernameFromToken(token);
        userService.deleteUser(username);
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 성공"));
    }

    // ✅ 사용자 검색 API (공통 처리)
    private ResponseEntity<?> getUserResponse(Optional<User> user) {
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ 사용자명(username)으로 회원 검색
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        return getUserResponse(userService.getUserByUsername(username));
    }

    // ✅ 이메일(email)로 회원 검색
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        return getUserResponse(userService.getUserByEmail(email));
    }

    // ✅ 전화번호(phone)로 회원 검색
    @GetMapping("/phone/{phone}")
    public ResponseEntity<?> getUserByPhone(@PathVariable String phone) {
        return getUserResponse(userService.getUserByPhone(phone));
    }

    // ✅ 중개업자(ROLE_REALTOR) 목록 조회
    @GetMapping("/realtors")
    public ResponseEntity<List<User>> getAllRealtors() {
        return ResponseEntity.ok(userService.getAllRealtors());
    }

    // ✅ 중개업자 라이선스 번호로 검색
    @GetMapping("/license/{licenseNumber}")
    public ResponseEntity<?> getUserByLicenseNumber(@PathVariable String licenseNumber) {
        return getUserResponse(userService.getUserLicenseNumber(licenseNumber));
    }

    // ✅ 특정 사용자가 등록한 매물 목록 (본인/다른 사람 모두 공개)
    @GetMapping("/{userId}/properties")
    public ResponseEntity<List<Property>> getPropertiesByOwner(@PathVariable Long userId) {
        return ResponseEntity.ok(propertyService.getPropertiesByOwner(userId));
    }

    @Operation(summary = "중개사 신뢰도 지표",
            description = "리뷰 가중평균 평점, 누적 찜, 승인+완료 거래 비율, 채팅 응답 중위값(분).",
            security = { @SecurityRequirement(name = "bearerAuth") })
    @GetMapping("/{userId}/realtor-stats")
    public ResponseEntity<UserStatsService.RealtorStats> getRealtorStats(@PathVariable Long userId) {
        return ResponseEntity.ok(userStatsService.computeRealtorStats(userId));
    }

    // ✅ 비밀번호 변경 (본인만)
    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "인증이 필요합니다."));
        }
        String token = authHeader.substring(7);
        String username = userService.getUsernameFromToken(token);
        String currentPassword = body.getOrDefault("currentPassword", "");
        String newPassword = body.getOrDefault("newPassword", "");
        if (newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("message", "새 비밀번호는 4자 이상이어야 합니다."));
        }
        userService.changePassword(username, currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("message", "비밀번호 변경 성공"));
    }
}