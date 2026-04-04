package com.candleora.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminAnnouncementRequest(
    @NotBlank @Size(max = 500) String message,
    boolean active,
    @NotNull Integer orderIndex
) {
}
