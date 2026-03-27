package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminTopProductResponse(
    Long productId,
    String name,
    String category,
    long unitsSold,
    BigDecimal revenue,
    Integer stock,
    boolean visible
) {
}
