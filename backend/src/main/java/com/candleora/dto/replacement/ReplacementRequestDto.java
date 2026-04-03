package com.candleora.dto.replacement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReplacementRequestDto(
    @NotNull(message = "Order item is required")
    Long orderItemId,
    @NotBlank(message = "Reason is required")
    @Size(max = 200, message = "Reason must be 200 characters or fewer")
    String reason,
    @Size(max = 2048, message = "Proof image URL must be 2048 characters or fewer")
    String proofImageUrl,
    @Size(max = 10, message = "You can upload up to 10 proof files")
    List<@NotBlank(message = "Proof URL cannot be blank") @Size(max = 2048, message = "Proof URL must be 2048 characters or fewer") String> proofAssetUrls,
    @Size(max = 1000, message = "Customer note must be 1000 characters or fewer")
    String customerNote
) {
}
