package com.candleora.dto.auth;

import java.time.Instant;
import java.time.LocalDate;

public record UserResponse(
    Long id,
    String name,
    String email,
    String role,
    String authProvider,
    boolean emailVerified,
    boolean phoneVerified,
    String phoneNumber,
    String alternatePhoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    String gender,
    LocalDate dateOfBirth,
    String locationLabel,
    Double latitude,
    Double longitude,
    Instant createdAt
) {
}
