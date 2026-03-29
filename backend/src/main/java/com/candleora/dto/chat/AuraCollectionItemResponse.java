package com.candleora.dto.chat;

import java.math.BigDecimal;

public record AuraCollectionItemResponse(
    Long productId,
    String slug,
    String productName,
    String imageUrl,
    String occasionTag,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
) {
}
