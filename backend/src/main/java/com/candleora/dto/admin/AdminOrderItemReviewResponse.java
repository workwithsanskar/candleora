package com.candleora.dto.admin;

import java.time.Instant;

public record AdminOrderItemReviewResponse(
    Long id,
    Integer rating,
    String message,
    String reviewerName,
    String reviewerEmail,
    Instant createdAt
) {
}
