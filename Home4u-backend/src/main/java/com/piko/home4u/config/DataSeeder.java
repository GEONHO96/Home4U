package com.piko.home4u.config;

import com.piko.home4u.model.AptDeal;
import com.piko.home4u.model.School;
import com.piko.home4u.model.SubwayStation;
import com.piko.home4u.model.Tenant;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.AptDealRepository;
import com.piko.home4u.repository.SchoolRepository;
import com.piko.home4u.repository.SubwayStationRepository;
import com.piko.home4u.repository.TenantRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * dev 프로파일(H2 인메모리) 에서 실행 시 샘플 데이터 삽입.
 * - SubwayStation: 서울 주요 환승/대형역 40+ (좌표는 공개 위키 수치)
 * - School: 강남/마포 주변 초·중·고 시드
 * - AptDeal: 주요 단지별 월별 거래가 시계열 (국토부 실거래가 연동 전까지의 플레이스홀더)
 * 이미 데이터가 있으면 스킵 → 컨테이너 재기동 시 중복 방지.
 */
@Slf4j
@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder {

    private final SubwayStationRepository subwayRepo;
    private final SchoolRepository schoolRepo;
    private final AptDealRepository aptDealRepo;
    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.context.annotation.Bean
    public CommandLineRunner homeFourUSeeder() {
        return args -> {
            seedTenants();
            seedSubway();
            seedSchools();
            seedAptDeals();
            seedAdmin();
        };
    }

    private void seedTenants() {
        if (tenantRepo.findBySlug("default").isEmpty()) {
            tenantRepo.save(Tenant.builder().name("Home4U").slug("default").active(true).build());
        }
        if (tenantRepo.findBySlug("demo-realty").isEmpty()) {
            tenantRepo.save(Tenant.builder().name("Demo Realty").slug("demo-realty").active(true).build());
        }
    }

    private void seedAdmin() {
        if (userRepo.findByUsername("admin").isPresent()) return;
        User admin = new User(
                "admin",
                passwordEncoder.encode("admin1234"),
                "admin@home4u.local",
                "010-0000-0000",
                UserRole.ROLE_ADMIN
        );
        userRepo.save(admin);
        log.info("Seeded admin account: admin / admin1234");
    }

    private void seedSubway() {
        if (subwayRepo.count() > 0) return;
        List<SubwayStation> stations = List.of(
                station("서울역", "1호선", 37.5547, 126.9707),
                station("서울역", "4호선", 37.5547, 126.9707),
                station("서울역", "공항철도", 37.5547, 126.9707),
                station("시청", "1호선", 37.5651, 126.9779),
                station("시청", "2호선", 37.5651, 126.9779),
                station("종로3가", "1호선", 37.5715, 126.9920),
                station("종로3가", "3호선", 37.5715, 126.9920),
                station("종로3가", "5호선", 37.5715, 126.9920),
                station("동대문역사문화공원", "2호선", 37.5651, 127.0070),
                station("왕십리", "2호선", 37.5613, 127.0370),
                station("왕십리", "5호선", 37.5613, 127.0370),
                station("성수", "2호선", 37.5446, 127.0560),
                station("잠실", "2호선", 37.5133, 127.1000),
                station("잠실", "8호선", 37.5133, 127.1000),
                station("강남", "2호선", 37.4979, 127.0276),
                station("선릉", "2호선", 37.5046, 127.0490),
                station("삼성", "2호선", 37.5089, 127.0635),
                station("역삼", "2호선", 37.5006, 127.0369),
                station("교대", "2호선", 37.4935, 127.0143),
                station("교대", "3호선", 37.4935, 127.0143),
                station("양재", "3호선", 37.4846, 127.0344),
                station("고속터미널", "3호선", 37.5049, 127.0049),
                station("고속터미널", "7호선", 37.5049, 127.0049),
                station("고속터미널", "9호선", 37.5049, 127.0049),
                station("압구정", "3호선", 37.5272, 127.0285),
                station("신사", "3호선", 37.5161, 127.0203),
                station("홍대입구", "2호선", 37.5571, 126.9245),
                station("홍대입구", "경의중앙선", 37.5571, 126.9245),
                station("홍대입구", "공항철도", 37.5571, 126.9245),
                station("합정", "2호선", 37.5496, 126.9137),
                station("합정", "6호선", 37.5496, 126.9137),
                station("상수", "6호선", 37.5479, 126.9237),
                station("디지털미디어시티", "6호선", 37.5767, 126.9014),
                station("디지털미디어시티", "경의중앙선", 37.5767, 126.9014),
                station("여의도", "5호선", 37.5215, 126.9241),
                station("여의도", "9호선", 37.5215, 126.9241),
                station("당산", "2호선", 37.5347, 126.9020),
                station("사당", "2호선", 37.4766, 126.9814),
                station("사당", "4호선", 37.4766, 126.9814),
                station("이수", "4호선", 37.4868, 126.9820),
                station("이수", "7호선", 37.4868, 126.9820),
                station("신도림", "1호선", 37.5087, 126.8912),
                station("신도림", "2호선", 37.5087, 126.8912),
                station("노원", "4호선", 37.6546, 127.0617),
                station("수유", "4호선", 37.6378, 127.0254),
                station("건대입구", "2호선", 37.5403, 127.0703),
                station("건대입구", "7호선", 37.5403, 127.0703),
                station("강변", "2호선", 37.5352, 127.0947),
                station("용산", "1호선", 37.5299, 126.9648),
                station("용산", "경의중앙선", 37.5299, 126.9648)
        );
        subwayRepo.saveAll(stations);
        log.info("Seeded {} subway stations", stations.size());
    }

    private static SubwayStation station(String name, String line, double lat, double lng) {
        return SubwayStation.builder().name(name).line(line).latitude(lat).longitude(lng).build();
    }

    private static School school(String name, String type, String address, double lat, double lng) {
        return School.builder().name(name).type(type).address(address).latitude(lat).longitude(lng).build();
    }

    private void seedSchools() {
        if (schoolRepo.count() > 0) return;
        List<School> schools = List.of(
                school("서울역삼초등학교", "초등학교", "서울 강남구 역삼동", 37.4998, 127.0370),
                school("역삼중학교", "중학교", "서울 강남구 역삼동", 37.5023, 127.0362),
                school("진선여자고등학교", "고등학교", "서울 강남구 역삼동", 37.5101, 127.0509),
                school("압구정초등학교", "초등학교", "서울 강남구 압구정동", 37.5262, 127.0299),
                school("언북중학교", "중학교", "서울 강남구 논현동", 37.5179, 127.0336),
                school("중동고등학교", "고등학교", "서울 강남구 일원동", 37.4875, 127.0824),
                school("상암초등학교", "초등학교", "서울 마포구 상암동", 37.5808, 126.8901),
                school("성산중학교", "중학교", "서울 마포구 성산동", 37.5701, 126.9155),
                school("숭문고등학교", "고등학교", "서울 마포구 대흥동", 37.5489, 126.9418),
                school("여의도초등학교", "초등학교", "서울 영등포구 여의도동", 37.5251, 126.9249),
                school("여의도중학교", "중학교", "서울 영등포구 여의도동", 37.5230, 126.9238),
                school("여의도고등학교", "고등학교", "서울 영등포구 여의도동", 37.5258, 126.9266)
        );
        schoolRepo.saveAll(schools);
        log.info("Seeded {} schools", schools.size());
    }

    private void seedAptDeals() {
        if (aptDealRepo.count() > 0) return;
        List<AptDeal> deals = new ArrayList<>();
        Random rng = new Random(42); // 재현 가능한 시드
        // 강남 대표 단지 — 최근 24개월 샘플
        seedMonthly(deals, rng, "타워팰리스", "강남구", "도곡동", 24, 280_000, 40.0, 84.0, 16);
        seedMonthly(deals, rng, "래미안대치팰리스", "강남구", "대치동", 24, 260_000, 45.0, 110.0, 20);
        // 마포
        seedMonthly(deals, rng, "마포래미안푸르지오", "마포구", "아현동", 24, 180_000, 34.0, 84.0, 15);
        // 여의도
        seedMonthly(deals, rng, "여의도시범아파트", "영등포구", "여의도동", 24, 210_000, 80.0, 130.0, 12);
        aptDealRepo.saveAll(deals);
        log.info("Seeded {} apt deals", deals.size());
    }

    private static void seedMonthly(
            List<AptDeal> out, Random rng,
            String aptName, String gungu, String dong,
            int months, int basePriceManWon, double areaMin, double areaMax, int floorMax
    ) {
        java.time.YearMonth ym = java.time.YearMonth.now().minusMonths(months);
        for (int i = 0; i < months; i++) {
            java.time.YearMonth cur = ym.plusMonths(i);
            // 노이즈 ± 5%, 완만한 상승 추세 ± i*0.3%
            double trend = 1.0 + i * 0.003;
            int samples = 1 + rng.nextInt(3); // 월당 1~3건
            for (int s = 0; s < samples; s++) {
                double jitter = 1.0 + (rng.nextDouble() - 0.5) * 0.10;
                int price = (int) Math.round(basePriceManWon * trend * jitter);
                double area = areaMin + rng.nextDouble() * (areaMax - areaMin);
                int floor = 2 + rng.nextInt(floorMax - 1);
                out.add(AptDeal.builder()
                        .apartmentName(aptName)
                        .gungu(gungu)
                        .dong(dong)
                        .dealYearMonth(cur.toString())
                        .price(price)
                        .area(Math.round(area * 10.0) / 10.0)
                        .floor(floor)
                        .build());
            }
        }
    }
}
