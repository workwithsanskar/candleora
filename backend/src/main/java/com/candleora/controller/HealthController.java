package com.candleora.controller;

import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return buildHealthResponse();
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        return buildHealthResponse();
    }

    private ResponseEntity<Map<String, Object>> buildHealthResponse() {
        try {
            Integer pingResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            boolean databaseReady = pingResult != null && pingResult == 1;

            if (!databaseReady) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                    Map.of(
                        "status", "degraded",
                        "service", "candleora-api",
                        "database", "unexpected-response",
                        "timestamp", Instant.now().toString()
                    )
                );
            }

            return ResponseEntity.ok(
                Map.of(
                    "status", "ok",
                    "service", "candleora-api",
                    "database", "reachable",
                    "timestamp", Instant.now().toString()
                )
            );
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                Map.of(
                    "status", "degraded",
                    "service", "candleora-api",
                    "database", "unreachable",
                    "timestamp", Instant.now().toString()
                )
            );
        }
    }
}
