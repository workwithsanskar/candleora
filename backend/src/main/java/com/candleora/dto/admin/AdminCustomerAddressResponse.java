package com.candleora.dto.admin;

import java.time.Instant;

public record AdminCustomerAddressResponse(
    Long id,
    String label,
    String fullName,
    String phone,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isDefault,
    Instant updatedAt
) {
}
