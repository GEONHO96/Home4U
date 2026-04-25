-- Home4U 초기 스키마 placeholder.
--
-- 운영 첫 배포 전에는 이 파일을 비워두고 baseline-on-migrate=true 로 빈 DB 에서 시작한다.
-- 실 배포 시 ./gradlew bootRun -Dspring.profiles.active=mysql 한 번 실행 후
-- `mysqldump --no-data` 또는 `flyway baseline` 으로 현재 스키마 스냅샷을
-- 이 파일에 대체해 넣고, 이후 변경은 V2__*.sql, V3__*.sql 로 추가한다.
--
-- 현재 스키마는 JPA 의 @Entity 정의가 단일 진실 공급원이며,
-- application-mysql.properties 에서 ddl-auto=validate 로 두어 Flyway 적용 결과가
-- 엔티티와 일치하지 않으면 부팅이 실패하도록 보호한다.

-- noop placeholder.
SELECT 1;
