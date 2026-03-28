package com.candleora.dto.admin;

import jakarta.validation.constraints.NotNull;

public record AdminInventoryAdjustmentRequest(
    @NotNull(message = "Adjustment is required")
    Integer adjustment,
    String note
) {
}
