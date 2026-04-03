package com.candleora.service;

import com.candleora.entity.ReplacementRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ShiprocketClient {

    private static final Logger logger = LoggerFactory.getLogger(ShiprocketClient.class);

    private final boolean enabled;
    private final String email;
    private final String password;
    private final String baseUrl;

    public ShiprocketClient(
        @Value("${app.shiprocket.enabled:false}") boolean enabled,
        @Value("${app.shiprocket.email:}") String email,
        @Value("${app.shiprocket.password:}") String password,
        @Value("${app.shiprocket.base-url:}") String baseUrl
    ) {
        this.enabled = enabled;
        this.email = email;
        this.password = password;
        this.baseUrl = baseUrl;
    }

    public PickupScheduleResult scheduleReversePickup(ReplacementRequest replacementRequest) {
        if (!enabled) {
            return PickupScheduleResult.manual("MANUAL_REVIEW");
        }

        if (!StringUtils.hasText(email) || !StringUtils.hasText(password) || !StringUtils.hasText(baseUrl)) {
            logger.warn(
                "Shiprocket reverse pickup is enabled but credentials are incomplete for replacement {}",
                replacementRequest.getId()
            );
            return PickupScheduleResult.manual("PENDING_CONFIGURATION");
        }

        logger.info(
            "Shiprocket reverse pickup requested for replacement {}. Manual fallback is being used until provider credentials are fully wired.",
            replacementRequest.getId()
        );
        return PickupScheduleResult.manual("PENDING_PROVIDER_SYNC");
    }

    public record PickupScheduleResult(boolean scheduled, String pickupReference, String pickupStatus) {
        public static PickupScheduleResult manual(String pickupStatus) {
            return new PickupScheduleResult(false, null, pickupStatus);
        }
    }
}
