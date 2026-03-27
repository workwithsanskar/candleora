package com.candleora.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderSummaryResponse(
    Long id,
    String customerName,
    String customerEmail,
    BigDecimal amount,
    String status,
    String paymentStatus,
    String paymentMethod,
    int itemsCount,
    Instant createdAt
) {
}
