package com.piko.home4u.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI home4uOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Home4U API")
                        .version("v1")
                        .description("Home4U 부동산 매물 거래 플랫폼 REST API. " +
                                "인증은 Authorization: Bearer <JWT>, 멀티테넌시는 X-Tenant-Slug 헤더로 분리됩니다."))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
