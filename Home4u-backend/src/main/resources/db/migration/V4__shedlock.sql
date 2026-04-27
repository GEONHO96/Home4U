-- T11 1/5 ShedLock 잠금 테이블.
--
-- 이 마이그레이션은 mysql 프로파일 (Flyway 활성) 에서만 실행된다.
-- dev (H2) 는 ShedLockConfig.ShedLockSchemaInitializer 가 부팅 시 동일 스키마를 IF NOT EXISTS 로 생성한다.

CREATE TABLE IF NOT EXISTS shedlock (
    name        VARCHAR(64)   NOT NULL,
    lock_until  TIMESTAMP(3)  NOT NULL,
    locked_at   TIMESTAMP(3)  NOT NULL,
    locked_by   VARCHAR(255)  NOT NULL,
    PRIMARY KEY (name)
);
