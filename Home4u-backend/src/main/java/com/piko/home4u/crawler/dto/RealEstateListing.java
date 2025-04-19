package com.piko.home4u.crawler.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RealEstateListing {
    private String address;
    private String price;
    private String date;
}