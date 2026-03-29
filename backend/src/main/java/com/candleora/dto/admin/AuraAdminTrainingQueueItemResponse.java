package com.candleora.dto.admin;

import com.candleora.entity.AuraTrainingStatus;
import java.time.Instant;

public record AuraAdminTrainingQueueItemResponse(
    Long id,
    String question,
    String detectedIntent,
    Integer occurrences,
    String lastAssistantMessage,
    String pagePath,
    AuraTrainingStatus status,
    String suggestedAnswer,
    String resolutionNotes,
    Instant createdAt,
    Instant updatedAt
) {
}
