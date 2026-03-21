package com.candleora.dto.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductResponse(
    Long id,
    String name,
    String slug,
    String description,
    BigDecimal price,
    Integer discount,
    Integer stock,
    String occasionTag,
    BigDecimal rating,
    CategoryResponse category,
    List<String> imageUrls,
    Instant createdAt
) {
}
