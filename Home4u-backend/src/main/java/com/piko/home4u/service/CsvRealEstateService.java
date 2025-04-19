package com.piko.home4u.service;

import com.piko.home4u.crawler.dto.RealEstateListing;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CsvRealEstateService {
    /**
     * CSV 파일 경로로부터 실거래가 데이터를 읽어들여 DTO 리스트로 반환
     * @param csvPath 로컬 경로 또는 절대 경로 (예: classpath:/data/거래.csv)
     */
    public List<RealEstateListing> parseCsv(String csvPath) throws IOException {
        Reader reader;
        if (csvPath.startsWith("classpath:")) {
            String resource = csvPath.substring("classpath:".length());
            InputStream is = getClass().getResourceAsStream(resource);
            if (is == null) throw new FileNotFoundException(resource);
            reader = new InputStreamReader(is, StandardCharsets.UTF_8);
        } else {
            reader = Files.newBufferedReader(Paths.get(csvPath), StandardCharsets.UTF_8);
        }

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()                  // 첫 줄을 헤더로 자동 감지
                .setSkipHeaderRecord(true)    // 헤더 레코드는 결과에서 제외
                .build();

        Iterable<CSVRecord> records = format.parse(reader);

        List<RealEstateListing> list = new ArrayList<>();
        for (CSVRecord r : records) {
            String addr = r.get("주소");
            String pr   = r.get("거래금액");
            String date = r.get("거래일");
            list.add(RealEstateListing.builder()
                    .address(addr)
                    .price(pr)
                    .date(date)
                    .build());
        }
        return list;
    }
}