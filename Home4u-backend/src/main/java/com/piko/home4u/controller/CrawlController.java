package com.piko.home4u.controller;

import com.piko.home4u.crawler.RealEstateCrawler;
import com.piko.home4u.crawler.dto.RealEstateListing;
import com.piko.home4u.service.CsvRealEstateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/crawl")
@RequiredArgsConstructor
public class CrawlController {

    private final RealEstateCrawler htmlCrawler;
    private final CsvRealEstateService csvService;

    /**
     * HTML 크롤링: /api/crawl/html?url={크롤링할 url}
     */
    @GetMapping("/html")
    public ResponseEntity<List<RealEstateListing>> crawlFromHtml(@RequestParam String url) {
        try {
            List<RealEstateListing> data = htmlCrawler.crawlListings(url);
            return ResponseEntity.ok(data);
        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(List.of());  // 실패 시 빈 리스트 리턴
        }
    }

    /**
     * CSV 파싱: /api/crawl/csv?path={csv 파일 경로}
     */
    @GetMapping("/csv")
    public ResponseEntity<List<RealEstateListing>> crawlFromCsv(@RequestParam String path) {
        try {
            List<RealEstateListing> data = csvService.parseCsv(path);
            return ResponseEntity.ok(data);
        } catch (IOException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_GATEWAY)
                    .body(List.of());
        }
    }
}
