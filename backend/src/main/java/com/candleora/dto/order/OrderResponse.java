package com.candleora.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record OrderResponse(
    Long id,
    String status,
    String paymentProvider,
    String paymentStatus,
    String paymentMethod,
    BigDecimal totalAmount,
    Instant createdAt,
    LocalDate estimatedDeliveryStart,
    LocalDate estimatedDeliveryEnd,
    String gatewayOrderId,
    String gatewayPaymentId,
    String shippingName,
    String contactEmail,
    String phone,
    String alternatePhoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String locationLabel,
    Double latitude,
    Double longitude,
    List<OrderItemResponse> items
) {
}
