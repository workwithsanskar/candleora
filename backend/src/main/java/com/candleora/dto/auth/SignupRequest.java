package com.candleora.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SignupRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @Size(min = 8) String password,
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
