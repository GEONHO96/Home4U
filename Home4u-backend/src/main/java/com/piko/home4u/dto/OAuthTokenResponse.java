package com.piko.home4u.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OAuthTokenResponse {
    private String token;
    private String provider;
}