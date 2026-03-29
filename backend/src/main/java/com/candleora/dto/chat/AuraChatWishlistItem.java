package com.candleora.dto.chat;

import java.math.BigDecimal;

public record AuraChatWishlistItem(
    Long productId,
    String slug,
    String productName,
    String imageUrl,
    String occasionTag,
    BigDecimal price
) {
}
