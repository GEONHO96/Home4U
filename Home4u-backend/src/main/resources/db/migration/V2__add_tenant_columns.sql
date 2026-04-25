-- T6 1/4 + T7 1/4 멀티테넌시 컬럼 도입.
--
-- tenants 테이블 + User/Property/Transaction/Review/Favorite/SavedSearch 의 tenant_id FK.
-- 운영 환경에서는 V1 baseline 이후 이 마이그레이션이 한 번 실행되며, 이후 새 컬럼이
-- 모두 default 테넌트로 backfill 되도록 INSERT/UPDATE 쿼리를 같이 수행한다.
--
-- dev (H2) 환경에서는 ddl-auto=update 가 컬럼을 자동 추가하므로 이 파일은 건너뛴다
-- (spring.flyway.enabled=false 가 기본).

CREATE TABLE IF NOT EXISTS tenants (
    id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL,
    slug        VARCHAR(40)  NOT NULL UNIQUE,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL
);

INSERT IGNORE INTO tenants (name, slug, active, created_at)
VALUES ('Home4U', 'default', 1, CURRENT_TIMESTAMP);

-- 도메인 엔티티에 tenant_id 추가 (nullable — backfill 후 NOT NULL 로 좁히는 마이그은 별도 V3 에서)
ALTER TABLE users        ADD COLUMN tenant_id BIGINT NULL,
                         ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE properties   ADD COLUMN tenant_id BIGINT NULL,
                         ADD CONSTRAINT fk_properties_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE transactions ADD COLUMN tenant_id BIGINT NULL,
                         ADD CONSTRAINT fk_transactions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE reviews      ADD COLUMN tenant_id BIGINT NULL,
                         ADD CONSTRAINT fk_reviews_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE favorites    ADD COLUMN tenant_id BIGINT NULL,
                         ADD CONSTRAINT fk_favorites_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
ALTER TABLE saved_searches ADD COLUMN tenant_id BIGINT NULL,
                           ADD CONSTRAINT fk_saved_searches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- 기존 행은 default 테넌트로 backfill
UPDATE users        u SET u.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE u.tenant_id IS NULL;
UPDATE properties   p SET p.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE p.tenant_id IS NULL;
UPDATE transactions t SET t.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE t.tenant_id IS NULL;
UPDATE reviews      r SET r.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE r.tenant_id IS NULL;
UPDATE favorites    f SET f.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE f.tenant_id IS NULL;
UPDATE saved_searches s SET s.tenant_id = (SELECT id FROM tenants WHERE slug='default') WHERE s.tenant_id IS NULL;
