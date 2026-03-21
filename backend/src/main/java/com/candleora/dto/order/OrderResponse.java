package com.candleora.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
    Long id,
    String status,
    BigDecimal totalAmount,
    Instant createdAt,
    List<OrderItemResponse> items
) {
}
