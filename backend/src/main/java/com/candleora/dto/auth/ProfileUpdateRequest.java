package com.candleora.dto.auth;

import java.time.LocalDate;

public record ProfileUpdateRequest(
    String name,
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
    Double longitude
) {
}
