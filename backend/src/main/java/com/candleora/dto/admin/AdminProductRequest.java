package com.candleora.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.util.List;

public record AdminProductRequest(
    String name,
    String slug,
    String description,
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    BigDecimal price,
    @DecimalMin(value = "0.0", inclusive = false, message = "Original price must be greater than zero")
    BigDecimal originalPrice,
    @DecimalMin(value = "0.0", inclusive = true, message = "Cost price cannot be negative")
    BigDecimal costPrice,
    @Min(value = 0, message = "Stock cannot be negative")
    Integer stock,
    Long categoryId,
    String categorySlug,
    String occasionTag,
    @DecimalMin(value = "0.0", inclusive = true, message = "Rating cannot be negative")
    BigDecimal rating,
    String scentNotes,
    String burnTime,
    Boolean visible,
    List<String> imageUrls
) {
}
