package com.candleora.dto.order;

import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long productId,
    String productName,
    String imageUrl,
    Integer quantity,
    BigDecimal price
) {
}
