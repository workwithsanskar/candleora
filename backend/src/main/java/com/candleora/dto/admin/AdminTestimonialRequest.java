package com.candleora.dto.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminTestimonialRequest(
    @NotBlank @Size(max = 120) String customerName,
    @NotBlank @Size(max = 40) String displayDate,
    @NotBlank @Size(max = 800) String quote,
    @NotNull @Min(1) @Max(5) Integer rating,
    boolean active,
    @NotNull Integer orderIndex
) {
}
