package com.candleora.dto.admin;

import java.time.LocalDateTime;

public record AdminContactMessageResponse(
    Long id,
    String name,
    String email,
    String phone,
    String subject,
    String message,
    LocalDateTime createdAt,
    LocalDateTime adminReviewedAt
) {
}
