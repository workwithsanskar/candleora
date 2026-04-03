package com.candleora.service;

import com.candleora.entity.OrderStatus;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class Ship24Client {

    private static final Logger logger = LoggerFactory.getLogger(Ship24Client.class);

    private final boolean enabled;
    private final String apiKey;
    private final String baseUrl;

    public Ship24Client(
        @Value("${app.ship24.enabled:false}") boolean enabled,
        @Value("${app.ship24.api-key:}") String apiKey,
        @Value("${app.ship24.base-url:}") String baseUrl
    ) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    public Optional<TrackingSnapshot> fetchTracking(String trackingNumber) {
        if (!enabled || !StringUtils.hasText(trackingNumber)) {
            return Optional.empty();
        }

        if (!StringUtils.hasText(apiKey) || !StringUtils.hasText(baseUrl)) {
            logger.warn("Ship24 tracking is enabled but the client configuration is incomplete.");
            return Optional.empty();
        }

        logger.info(
            "Ship24 sync is configured for tracking number {}. A safe no-op fallback is being used until provider credentials are exercised.",
            trackingNumber
        );
        return Optional.empty();
    }

    public record TrackingSnapshot(
        String courierName,
        String trackingUrl,
        OrderStatus status,
        Instant deliveredAt
    ) {
    }
}
