package com.candleora.dto.catalog;

import java.time.Instant;

public record ProductReviewResponse(
    Long id,
    String reviewerName,
    Integer rating,
    String message,
    Instant createdAt
) {
}
