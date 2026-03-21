package com.candleora.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @Size(min = 8) String password
) {
}
