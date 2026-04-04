package com.candleora.dto.admin;

import java.time.Instant;

public record AdminAnnouncementResponse(
    Long id,
    String message,
    boolean active,
    Integer orderIndex,
    Instant createdAt,
    Instant updatedAt
) {
}
