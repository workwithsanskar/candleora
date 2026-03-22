package com.candleora.dto.auth;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record PhoneAuthRequest(
    @NotBlank String idToken,
    String name,
    String email,
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
