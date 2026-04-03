package com.candleora.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record AdminOrderTrackingEventRequest(
    @NotBlank(message = "Tracking step status is required")
    String status,
    Instant timestamp,
    @Size(max = 1000, message = "Tracking detail must be 1000 characters or fewer")
    String detail
) {
}
