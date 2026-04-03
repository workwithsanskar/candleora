package com.candleora.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AdminOrderTrackingUpdateRequest(
    @Size(max = 128, message = "Tracking number must be 128 characters or fewer")
    String trackingNumber,
    @Size(max = 128, message = "Courier name must be 128 characters or fewer")
    String courierName,
    @Size(max = 1024, message = "Tracking URL must be 1024 characters or fewer")
    String trackingUrl,
    @Valid List<AdminOrderTrackingEventRequest> events
) {
}
