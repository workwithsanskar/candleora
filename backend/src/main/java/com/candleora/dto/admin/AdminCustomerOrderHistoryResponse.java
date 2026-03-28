package com.candleora.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminCustomerOrderHistoryResponse(
    Long id,
    Instant createdAt,
    String status,
    String paymentStatus,
    String paymentMethod,
    BigDecimal totalAmount,
    BigDecimal subtotalAmount,
    BigDecimal discountAmount,
    String couponCode,
    int itemsCount,
    String shippingName,
    String phone,
    String contactEmail,
    String alternatePhoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    String locationLabel,
    LocalDate estimatedDeliveryStart,
    LocalDate estimatedDeliveryEnd,
    Instant cancelledAt,
    String cancellationReason,
    List<AdminCustomerOrderItemResponse> items
) {
}
