package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String phone;

    @Enumerated(EnumType.STRING)  // ✅ Enum을 문자열로 저장
    @Column(nullable = false)
    private UserRole role;

    @Column(unique = true)
    private String licenseNumber;  // ✅ 중개업자 라이선스 번호 (일반 사용자: null 허용)

    private String agencyName;  // ✅ 중개업소 이름 (일반 사용자: null 허용)

    public User(String username, String password, String email, String phone, UserRole role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }
}