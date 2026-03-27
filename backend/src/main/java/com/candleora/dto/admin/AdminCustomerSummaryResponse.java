package com.candleora.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminCustomerSummaryResponse(
    Long id,
    String name,
    String email,
    String phoneNumber,
    long totalOrders,
    BigDecimal totalSpent,
    BigDecimal averageOrderValue,
    Instant lastOrderAt,
    Instant createdAt
) {
}
