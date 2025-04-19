package com.piko.home4u.crawler;

import com.piko.home4u.crawler.dto.RealEstateListing;
import lombok.RequiredArgsConstructor;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RealEstateCrawler {
    private static final Logger log = LoggerFactory.getLogger(RealEstateCrawler.class);

    @Value("${crawler.userAgent:Mozilla/5.0}")
    private String userAgent;

    @Value("${crawler.timeout:10000}")
    private int timeout;

    @Value("${crawler.selector.rows:table.listings > tbody > tr}")
    private String rowSelector;

    @Value("${crawler.selector.address:td.address}")
    private String addressSelector;

    @Value("${crawler.selector.price:td.price}")
    private String priceSelector;

    @Value("${crawler.selector.date:td.date}")
    private String dateSelector;

    /**
     * 지정한 URL 에서 매물 리스트를 파싱합니다.
     * @param targetUrl 크롤링할 부동산 공공데이터 페이지 URL
     * @return 매물 정보 리스트
     * @throws IOException           네트워크/파싱 오류
     * @throws IllegalArgumentException 잘못된 URL
     */
    public List<RealEstateListing> crawlListings(String targetUrl) throws IOException {
        // URL 검증
        try {
            URI uri = new URI(targetUrl);
            if (uri.getScheme() == null || !(uri.getScheme().startsWith("http"))) {
                throw new IllegalArgumentException("유효하지 않은 URL 스킴입니다: " + targetUrl);
            }
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("잘못된 URL 형식입니다: " + targetUrl, e);
        }

        log.info("크롤링 시작: {}", targetUrl);
        Connection conn = Jsoup.connect(targetUrl)
                .userAgent(userAgent)
                .timeout(timeout)
                .followRedirects(true);
//                .validateTLSCertificates(true);

        Document doc = conn.get();
        Elements rows = doc.select(rowSelector);
        log.debug("행 개수: {}", rows.size());

        List<RealEstateListing> listings = new ArrayList<>();
        for (Element row : rows) {
            String addr = row.select(addressSelector).text();
            String price = row.select(priceSelector).text();
            String date = row.select(dateSelector).text();

            if (addr.isEmpty() && price.isEmpty()) {
                log.debug("빈 행 건너뜀");
                continue;
            }

            RealEstateListing item = RealEstateListing.builder()
                    .address(addr)
                    .price(price)
                    .date(date)
                    .build();
            listings.add(item);
        }
        log.info("크롤링 완료: 총 {}개 아이템", listings.size());
        return listings;
    }
}