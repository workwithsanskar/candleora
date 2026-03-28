package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminCustomerOrderItemResponse(
    Long id,
    Long productId,
    String productName,
    String imageUrl,
    Integer quantity,
    BigDecimal price
) {
}
