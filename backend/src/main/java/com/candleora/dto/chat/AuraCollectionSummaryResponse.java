package com.candleora.dto.chat;

import java.math.BigDecimal;
import java.util.List;

public record AuraCollectionSummaryResponse(
    String title,
    String actionLabel,
    String actionPath,
    Integer totalItems,
    BigDecimal totalAmount,
    List<AuraCollectionItemResponse> items
) {
}
