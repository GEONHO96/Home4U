package com.piko.home4u.repository;

import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ 사용자명(username)으로 회원 검색
    Optional<User> findByUsername(String username);

    // ✅ 이메일(email)로 회원 검색
    Optional<User> findByEmail(String email);

    // ✅ 전화번호(phone)로 회원 검색
    Optional<User> findByPhone(String phone);

    // ✅ 역할(Role) 기준 검색 — UserService.getAllRealtors()에서 ROLE_REALTOR로 호출
    List<User> findByRole(UserRole role);

    // ✅ 중개업자 라이선스 번호로 검색
    Optional<User> findByLicenseNumber(String licenseNumber);
}
