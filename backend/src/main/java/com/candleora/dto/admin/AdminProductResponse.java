package com.candleora.dto.admin;

import com.candleora.dto.catalog.CategoryResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminProductResponse(
    Long id,
    String name,
    String slug,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    BigDecimal costPrice,
    Integer discount,
    Integer stock,
    String status,
    boolean visible,
    String occasionTag,
    BigDecimal rating,
    String scentNotes,
    String burnTime,
    CategoryResponse category,
    List<String> imageUrls,
    Instant createdAt
) {
}
