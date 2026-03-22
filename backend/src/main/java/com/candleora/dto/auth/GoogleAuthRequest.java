package com.candleora.dto.auth;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record GoogleAuthRequest(
    @NotBlank String credential,
    String name,
    String phoneNumber,
    String alternatePhoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String gender,
    LocalDate dateOfBirth,
    String locationLabel,
    Double latitude,
    Double longitude
) {
}
