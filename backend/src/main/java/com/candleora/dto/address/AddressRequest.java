package com.candleora.dto.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
    @Size(max = 80) String label,
    @NotBlank @Size(max = 255) String recipientName,
    @NotBlank @Size(max = 255) String addressLine1,
    @Size(max = 255) String addressLine2,
    @NotBlank @Size(max = 120) String city,
    @NotBlank @Size(max = 120) String state,
    @NotBlank @Size(max = 20) String postalCode,
    @Size(max = 120) String country,
    @NotBlank @Size(max = 40) String phoneNumber,
    Boolean isDefault
) {
}
