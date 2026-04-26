package com.piko.home4u.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Flyway 마이그레이션 V1 ~ V3 가 실 MySQL 8 컨테이너에서 정상 적용되는지 검증.
 *
 * 로컬에서는 Docker Desktop 이 떠 있어야 한다. CI 는 ubuntu-latest 러너에 도커가 기본 설치되어 있어
 * `RUN_INTEGRATION=true` 환경변수가 켜진 워크플로우 잡에서만 활성화한다 — 단위 테스트가 도커를 요구하는
 * 일을 막기 위함.
 */
@EnabledIfEnvironmentVariable(named = "RUN_INTEGRATION", matches = "true")
@SpringBootTest
@Testcontainers
class FlywayMigrationIT {

    @Container
    @SuppressWarnings("resource")
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("home4u")
            .withUsername("home4u")
            .withPassword("home4u");

    @DynamicPropertySource
    static void wireDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
        // 운영 mysql 프로파일과 같은 정책으로 Flyway 적용 + Hibernate validate
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.locations", () -> "classpath:db/migration");
        registry.add("spring.flyway.baseline-on-migrate", () -> "true");
        registry.add("spring.flyway.baseline-version", () -> "0");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.MySQLDialect");
    }

    @Autowired private DataSource dataSource;

    @Test
    void flywayHistory_appliesV1V2V3() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            ResultSet rs = s.executeQuery("SELECT version, success FROM flyway_schema_history ORDER BY installed_rank");
            int seen = 0;
            while (rs.next()) {
                String v = rs.getString("version");
                boolean ok = rs.getBoolean("success");
                if ("1".equals(v) || "2".equals(v) || "3".equals(v)) {
                    assertThat(ok).as("V%s success", v).isTrue();
                    seen++;
                }
            }
            assertThat(seen).isEqualTo(3);
        }
    }

    @Test
    void tenantColumns_allNotNullWithIndex() throws Exception {
        String[] tables = {"users", "properties", "transactions", "reviews", "favorites", "saved_searches"};
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            for (String t : tables) {
                ResultSet col = s.executeQuery(
                        "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS " +
                                "WHERE TABLE_SCHEMA='home4u' AND TABLE_NAME='" + t + "' AND COLUMN_NAME='tenant_id'");
                assertThat(col.next()).as("tenant_id present on %s", t).isTrue();
                assertThat(col.getString("IS_NULLABLE")).as("tenant_id NOT NULL on %s", t).isEqualTo("NO");

                ResultSet idx = s.executeQuery(
                        "SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS " +
                                "WHERE TABLE_SCHEMA='home4u' AND TABLE_NAME='" + t + "' AND INDEX_NAME='idx_" + t + "_tenant'");
                idx.next();
                assertThat(idx.getInt("c")).as("idx on %s.tenant_id", t).isPositive();
            }
        }
    }

    @Test
    void defaultTenantSeeded() throws Exception {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            ResultSet rs = s.executeQuery("SELECT COUNT(*) AS c FROM tenants WHERE slug='default'");
            rs.next();
            assertThat(rs.getInt("c")).isEqualTo(1);
        }
    }
}
