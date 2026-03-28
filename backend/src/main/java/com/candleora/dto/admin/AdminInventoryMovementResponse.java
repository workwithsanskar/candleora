package com.candleora.dto.admin;

import java.time.Instant;

public record AdminInventoryMovementResponse(
    Long id,
    String type,
    Integer onHandDelta,
    Integer reservedDelta,
    Integer onHandAfter,
    Integer reservedAfter,
    Integer availableAfter,
    String referenceType,
    Long referenceId,
    String note,
    Instant createdAt
) {
}
