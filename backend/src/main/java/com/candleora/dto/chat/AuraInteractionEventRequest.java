package com.candleora.dto.chat;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record AuraInteractionEventRequest(
    @NotBlank String eventType,
    String pagePath,
    String chatScope,
    String intent,
    String message,
    Long productId,
    Long orderId,
    Map<String, Object> metadata
) {
}
