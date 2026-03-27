package com.candleora.dto.catalog;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductReviewRequest(
    @NotBlank @Size(max = 120) String reviewerName,
    @NotBlank @Email @Size(max = 255) String reviewerEmail,
    @NotNull @Min(1) @Max(5) Integer rating,
    @NotBlank @Size(max = 2000) String message
) {
}
