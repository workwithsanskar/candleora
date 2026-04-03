package com.candleora.dto.replacement;

import jakarta.validation.constraints.Size;

public record ReplacementDecisionRequest(
    @Size(max = 1000, message = "Admin note must be 1000 characters or fewer")
    String adminNote
) {
}
