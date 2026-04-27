package com.piko.home4u.config;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;

import javax.sql.DataSource;

/**
 * 멀티 인스턴스 환경에서 BackgroundWorker 의 @Scheduled 잡이 한 번만 실행되도록 보장.
 *
 * 잠금 정보는 `shedlock` 테이블에 저장된다 — dev (H2) 는 부팅 시 IF NOT EXISTS 로 생성,
 * 운영 (MySQL) 은 Flyway V4 마이그레이션으로 생성한다.
 */
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT5M")
public class ShedLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime() // DB 시간 사용 — 인스턴스 간 시간 편차 무시
                        .build());
    }

    @Bean
    public ShedLockSchemaInitializer shedLockSchemaInitializer(JdbcClient jdbcClient) {
        return new ShedLockSchemaInitializer(jdbcClient);
    }

    /**
     * dev (H2) 부팅 시 shedlock 테이블이 없으면 만든다.
     * 운영 MySQL 은 Flyway V4 가 같은 스키마를 만들어 두 환경의 테이블이 동일하다.
     */
    public static class ShedLockSchemaInitializer {
        public ShedLockSchemaInitializer(JdbcClient jdbcClient) {
            jdbcClient.sql("""
                    CREATE TABLE IF NOT EXISTS shedlock (
                        name        VARCHAR(64)   NOT NULL,
                        lock_until  TIMESTAMP(3)  NOT NULL,
                        locked_at   TIMESTAMP(3)  NOT NULL,
                        locked_by   VARCHAR(255)  NOT NULL,
                        PRIMARY KEY (name)
                    )
                    """).update();
        }
    }
}
