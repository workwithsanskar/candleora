package com.candleora.dto.chat;

import java.math.BigDecimal;

public record AuraOrderItemSummaryResponse(
    Long productId,
    String productName,
    String imageUrl,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
) {
}
