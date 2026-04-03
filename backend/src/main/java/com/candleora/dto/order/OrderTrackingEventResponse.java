package com.candleora.dto.order;

import java.time.Instant;

public record OrderTrackingEventResponse(
    String status,
    String detail,
    Instant timestamp
) {
}
