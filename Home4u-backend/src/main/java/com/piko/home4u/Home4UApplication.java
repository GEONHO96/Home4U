package com.piko.home4u;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class Home4UApplication {

    public static void main(String[] args) {
        SpringApplication.run(Home4UApplication.class, args);
    }

}
