package com.candleora.dto.admin;

import com.candleora.dto.catalog.CategoryResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminProductResponse(
    Long id,
    String name,
    String slug,
    String sku,
    String description,
    BigDecimal price,
    BigDecimal originalPrice,
    BigDecimal costPrice,
    Integer discount,
    Integer stock,
    Integer reservedStock,
    Integer availableStock,
    Integer lowStockThreshold,
    String status,
    boolean visible,
    String occasionTag,
    BigDecimal rating,
    String scentNotes,
    String burnTime,
    CategoryResponse category,
    List<String> imageUrls,
    List<Long> similarProductIds,
    Instant createdAt
) {
}
