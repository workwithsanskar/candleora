package com.candleora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CandleoraApplication {

    public static void main(String[] args) {
        SpringApplication.run(CandleoraApplication.class, args);
    }
}
