package com.piko.home4u.dto;

import com.piko.home4u.model.UserRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSignupDto {
    @JsonProperty("username") // ✅ JSON 필드명 명확히 지정
    private String username;

    @JsonProperty("password")
    private String password;

    @JsonProperty("email")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("role")
    private UserRole role; // ROLE_USER or ROLE_RELATOR

    @JsonProperty("licenseNumber")
    private String licenseNumber; // 중개업자(공인중개사)일 경우 필요

    @JsonProperty("agencyName")
    private String agencyName; // 중개업자(공인중개사)일 경우 필요
}