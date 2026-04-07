package com.candleora.dto.cart;

import java.math.BigDecimal;

public record CartItemResponse(
    Long id,
    Long productId,
    String productName,
    String slug,
    String occasionTag,
    String imageUrl,
    BigDecimal unitPrice,
    BigDecimal originalUnitPrice,
    Integer stock,
    Integer quantity,
    BigDecimal lineTotal
) {
}
