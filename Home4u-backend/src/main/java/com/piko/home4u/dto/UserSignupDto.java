package com.piko.home4u.dto;

import com.piko.home4u.model.UserRole;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSignupDto {
    private String username;
    private String password;
    private String email;
    private String phone;
    private UserRole role; // ROLE_USER or ROLE_RELATOR

    private String licenseNumber; // 중개업자(공인중개사)일 경우 필요
    private String agencyName; // 중개업자(공인중개사)일 경우 필요
}