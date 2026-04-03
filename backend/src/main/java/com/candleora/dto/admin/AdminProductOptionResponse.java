package com.candleora.dto.admin;

public record AdminProductOptionResponse(
    Long id,
    String name,
    String sku,
    String slug,
    String categoryName,
    String imageUrl,
    boolean visible
) {
}
