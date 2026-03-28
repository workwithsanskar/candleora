package com.candleora.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProfileUpdateRequest(
    @NotBlank String name,
    @NotBlank String phoneNumber,
    String alternatePhoneNumber,
    @NotBlank String addressLine1,
    String addressLine2,
    @NotBlank String city,
    @NotBlank String state,
    @NotBlank String postalCode,
    @NotBlank String country,
    String gender,
    LocalDate dateOfBirth,
    @NotBlank String locationLabel,
    @NotNull Double latitude,
    @NotNull Double longitude
) {
}
