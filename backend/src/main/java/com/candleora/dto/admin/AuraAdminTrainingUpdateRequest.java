package com.candleora.dto.admin;

import com.candleora.entity.AuraTrainingStatus;
import jakarta.validation.constraints.NotNull;

public record AuraAdminTrainingUpdateRequest(
    @NotNull AuraTrainingStatus status,
    String suggestedAnswer,
    String resolutionNotes
) {
}
