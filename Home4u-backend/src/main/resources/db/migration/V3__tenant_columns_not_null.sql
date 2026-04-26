-- T8 2/3 — backfill 이후 tenant_id 를 NOT NULL 로 타이트닝.
--
-- V2 가 default 테넌트로 모든 legacy 행을 채워두므로, 이 마이그레이션 실행 시점에는
-- tenant_id IS NULL 인 행이 없어야 한다. 실패 시 V2 누락 의심 → 운영자 확인 필요.

-- 누락 검증 (옵션). MySQL 은 SIGNAL 로 abort.
-- 만약 NULL 이 남아있다면 마이그레이션 실패해 운영자가 V2 적용 여부 확인 가능.
DELIMITER $$
DROP PROCEDURE IF EXISTS guard_tenant_not_null$$
CREATE PROCEDURE guard_tenant_not_null()
BEGIN
    DECLARE leftover INT;
    SELECT COUNT(*) INTO leftover FROM users WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in users; V2 backfill missed';
    END IF;
    SELECT COUNT(*) INTO leftover FROM properties WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in properties';
    END IF;
    SELECT COUNT(*) INTO leftover FROM transactions WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in transactions';
    END IF;
    SELECT COUNT(*) INTO leftover FROM reviews WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in reviews';
    END IF;
    SELECT COUNT(*) INTO leftover FROM favorites WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in favorites';
    END IF;
    SELECT COUNT(*) INTO leftover FROM saved_searches WHERE tenant_id IS NULL;
    IF leftover > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'tenant_id NULL rows remain in saved_searches';
    END IF;
END$$
DELIMITER ;

CALL guard_tenant_not_null();
DROP PROCEDURE guard_tenant_not_null;

ALTER TABLE users          MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE properties     MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE transactions   MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE reviews        MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE favorites      MODIFY COLUMN tenant_id BIGINT NOT NULL;
ALTER TABLE saved_searches MODIFY COLUMN tenant_id BIGINT NOT NULL;

-- 테넌트별 조회 인덱스 (Hibernate @Filter 의 WHERE tenant_id = ? 가 매 쿼리에 추가됨)
CREATE INDEX idx_users_tenant          ON users(tenant_id);
CREATE INDEX idx_properties_tenant     ON properties(tenant_id);
CREATE INDEX idx_transactions_tenant   ON transactions(tenant_id);
CREATE INDEX idx_reviews_tenant        ON reviews(tenant_id);
CREATE INDEX idx_favorites_tenant      ON favorites(tenant_id);
CREATE INDEX idx_saved_searches_tenant ON saved_searches(tenant_id);
