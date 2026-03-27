package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminTopCustomerResponse(
    Long id,
    String name,
    String email,
    BigDecimal totalSpent,
    long totalOrders
) {
}
