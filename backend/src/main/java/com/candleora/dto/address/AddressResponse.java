package com.candleora.dto.address;

import java.time.Instant;

public record AddressResponse(
    Long id,
    String label,
    String recipientName,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    String phoneNumber,
    boolean isDefault,
    Instant createdAt,
    Instant updatedAt
) {
}
