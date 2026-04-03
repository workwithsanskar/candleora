package com.candleora.dto.admin;

import java.time.Instant;

public record AdminNotificationItemResponse(
    String type,
    Long entityId,
    String title,
    String subtitle,
    String detail,
    Instant timestamp
) {
}
