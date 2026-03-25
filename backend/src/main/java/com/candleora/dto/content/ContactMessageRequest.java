package com.candleora.dto.content;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactMessageRequest(
    @NotBlank @Size(max = 120) String name,
    @Email @NotBlank @Size(max = 160) String email,
    @NotBlank @Size(max = 30) String phone,
    @NotBlank @Size(max = 160) String subject,
    @NotBlank @Size(max = 4000) String message
) {
}
