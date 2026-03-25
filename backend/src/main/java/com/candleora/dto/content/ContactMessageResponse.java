package com.candleora.dto.content;

import java.time.LocalDateTime;

public record ContactMessageResponse(
    Long id,
    String name,
    String email,
    String phone,
    String subject,
    String message,
    LocalDateTime createdAt
) {
}
