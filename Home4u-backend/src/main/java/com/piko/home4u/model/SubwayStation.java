package com.piko.home4u.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * 서울 지하철역. 외부 API 없이 동작하도록 주요 역만 시드에 포함.
 * 같은 이름이 여러 호선에 있을 수 있어(환승역) (name, line) 기준으로만 유일.
 */
@Entity
@Table(name = "subway_stations", indexes = {
        @Index(name = "idx_subway_name", columnList = "name")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubwayStation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 20)
    private String line;   // "1호선" 등

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;
}
