package com.candleora.dto.admin;

import java.time.Instant;

public record AdminTestimonialResponse(
    Long id,
    String customerName,
    String displayDate,
    String quote,
    Integer rating,
    boolean active,
    Integer orderIndex,
    Instant createdAt,
    Instant updatedAt
) {
}
