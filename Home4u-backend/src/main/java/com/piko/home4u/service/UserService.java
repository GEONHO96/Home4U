package com.piko.home4u.service;

import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.UserRepository;
import com.piko.home4u.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // ✅ 회원가입 로직 (일반 사용자 & 공인중개사)
    public User registerUser(UserSignupDto userSignupDto) {
        if (userRepository.findByUsername(userSignupDto.getUsername()).isPresent()) {
            throw new RuntimeException("이미 존재하는 사용자입니다.");
        }

        UserRole role = userSignupDto.getRole();
        User user = new User(
                userSignupDto.getUsername(),
                passwordEncoder.encode(userSignupDto.getPassword()),
                userSignupDto.getEmail(),
                userSignupDto.getPhone(),
                role
        );

        // 중개업자인 경우 추가 정보 설정
        if (role == UserRole.ROLE_REALTOR) { // ✅ ENUM 값 변경 반영
            user.setLicenseNumber(userSignupDto.getLicenseNumber()); // ✅ setter 메서드 사용
            user.setAgencyName(userSignupDto.getAgencyName()); // ✅ setter 메서드 사용
        }

        return userRepository.save(user);
    }

    // ✅ 로그인 로직 (JWT 토큰 발급)
    public String login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        return jwtTokenProvider.createToken(user.getUsername());
    }

    // ✅ JWT 토큰에서 사용자명 추출
    public String getUsernameFromToken(String token) {
        return jwtTokenProvider.getUsername(token);
    }

    // ✅ 회원 탈퇴
    public void deleteUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        userRepository.delete(user);
    }

    // ✅ 사용자명(username)으로 회원 검색
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // ✅ 이메일(email)로 회원 검색
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // ✅ 전화번호(phone)로 회원 검색
    public Optional<User> getUserByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    // ✅ 중개업자 목록 조회 (수정된 메서드 사용)
    public List<User> getAllRealtors() {
        return userRepository.findByRole(UserRole.ROLE_REALTOR);  // ✅ findByRole로 변경
    }

    // ✅ 중개업자 라이선스 번호로 검색
    public Optional<User> getUserLicenseNumber(String licenseNumber) {
        return userRepository.findByLicenseNumber(licenseNumber);
    }
}
