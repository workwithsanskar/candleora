package com.candleora.dto.catalog;

import java.math.BigDecimal;
import java.util.List;

public record ProductReviewSummaryResponse(
    BigDecimal averageRating,
    long reviewCount,
    List<ProductReviewResponse> reviews
) {
}
