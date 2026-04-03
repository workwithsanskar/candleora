package com.candleora.dto.order;

import java.time.Instant;
import java.util.List;

public record OrderReplacementResponse(
    Long id,
    Long orderItemId,
    Long productId,
    String productName,
    String productImageUrl,
    String reason,
    String customerNote,
    String status,
    Instant requestedAt,
    Instant approvedAt,
    String proofImageUrl,
    List<String> proofAssetUrls,
    String adminNote,
    Boolean isFraudSuspected,
    String pickupReference,
    String pickupStatus
) {
}
