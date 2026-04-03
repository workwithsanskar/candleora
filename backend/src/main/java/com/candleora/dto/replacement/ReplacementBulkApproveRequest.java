package com.candleora.dto.replacement;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReplacementBulkApproveRequest(
    @NotEmpty(message = "At least one replacement request must be selected")
    List<Long> ids,
    @Size(max = 1000, message = "Admin note must be 1000 characters or fewer")
    String adminNote
) {
}
