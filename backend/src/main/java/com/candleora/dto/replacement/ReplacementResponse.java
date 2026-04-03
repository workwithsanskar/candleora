package com.candleora.dto.replacement;

import java.time.Instant;
import java.util.List;

public record ReplacementResponse(
    Long id,
    Long orderId,
    Long orderItemId,
    Long productId,
    String productName,
    String productImageUrl,
    String reason,
    String customerNote,
    String status,
    Instant requestedAt,
    Instant approvedAt,
    Instant adminReviewedAt,
    String proofImageUrl,
    List<String> proofAssetUrls,
    String adminNote,
    Boolean isFraudSuspected,
    String pickupReference,
    String pickupStatus,
    String customerName,
    String customerEmail
) {
}
