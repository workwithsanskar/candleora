package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminDistributionItemResponse(
    String label,
    BigDecimal value
) {
}
