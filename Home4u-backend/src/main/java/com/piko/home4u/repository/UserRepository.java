package com.piko.home4u.repository;

import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ 사용자명(username)으로 회원 검색
    Optional<User> findByUsername(@Param("username") String username);

    // ✅ 이메일(email)로 회원 검색
    Optional<User> findByEmail(@Param("email") String email);

    // ✅ 전화번호(phone)로 회원 검색
    Optional<User> findByPhone(@Param("phone") String phone);

    // ✅ 역할(Role)이 'REALTOR'인 사용자 찾기
    List<User> findByRole(UserRole role);

    // ✅ JPQL 쿼리를 직접 작성하는 방법
    @Query("SELECT u FROM User u WHERE u.role = 'REALTOR'")
    List<User> findAllRealtors();

    // ✅ 중개업자 라이선스 번호로 검색
    Optional<User> findByLicenseNumber(@Param("licenseNumber") String licenseNumber);
}