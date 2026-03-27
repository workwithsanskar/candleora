package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminTrendPointResponse(
    String label,
    BigDecimal revenue,
    long orders,
    BigDecimal profit
) {
}
