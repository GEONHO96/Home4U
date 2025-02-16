package com.piko.home4u.controller;

import com.piko.home4u.dto.LoginDto;
import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.User;
import com.piko.home4u.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    // ✅ 회원가입 API (일반 사용자 & 공인중개사)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserSignupDto userSignupDto) {
        userService.registerUser(userSignupDto);
        return ResponseEntity.ok(Map.of("message", "회원 가입 성공"));
    }

    // ✅ 로그인 API (JWT 토큰 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDto loginDto) {
        String token = userService.login(loginDto.getUsername(), loginDto.getPassword());
        return ResponseEntity.ok(Map.of("token", token));
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

    // ✅ 중계업자(ROLE_REALTOR) 목록 조회
    @GetMapping("/relators")
    public ResponseEntity<List<User>> getAllRelators() {
        return ResponseEntity.ok(userService.getAllRealtors());
    }

    // ✅ 중개업자 라이선스 번호로 검색
    @GetMapping("/license/{licenseNumber}")
    public ResponseEntity<?> getUserByLicenseNumber(@PathVariable String licenseNumber) {
        return getUserResponse(userService.getUserLicenseNumber(licenseNumber));
    }
}