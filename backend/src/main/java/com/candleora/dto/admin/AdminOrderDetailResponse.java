package com.candleora.dto.admin;

import com.candleora.dto.order.OrderItemResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminOrderDetailResponse(
    Long id,
    Long userId,
    String customerName,
    String customerEmail,
    String phone,
    String alternatePhoneNumber,
    String status,
    String paymentStatus,
    String paymentMethod,
    BigDecimal totalAmount,
    BigDecimal subtotalAmount,
    BigDecimal discountAmount,
    String couponCode,
    Instant createdAt,
    LocalDate estimatedDeliveryStart,
    LocalDate estimatedDeliveryEnd,
    Instant cancelledAt,
    String cancellationReason,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    List<OrderItemResponse> items
) {
}
