package com.candleora.dto.catalog;

import java.math.BigDecimal;

public record ProductSummaryResponse(
    Long id,
    String name,
    String slug,
    BigDecimal price,
    BigDecimal originalPrice,
    Integer discount,
    Integer stock,
    String occasionTag,
    BigDecimal rating,
    CategoryResponse category,
    String imageUrl
) {
}
