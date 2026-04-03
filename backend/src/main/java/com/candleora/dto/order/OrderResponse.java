package com.candleora.dto.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record OrderResponse(
    Long id,
    String status,
    String paymentProvider,
    String paymentStatus,
    String paymentMethod,
    BigDecimal totalAmount,
    BigDecimal subtotalAmount,
    BigDecimal discountAmount,
    String couponCode,
    Instant createdAt,
    LocalDate estimatedDeliveryStart,
    LocalDate estimatedDeliveryEnd,
    String gatewayOrderId,
    String gatewayPaymentId,
    String invoiceNumber,
    String shippingName,
    String contactEmail,
    String phone,
    String alternatePhoneNumber,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    String locationLabel,
    Double latitude,
    Double longitude,
    Boolean canCancel,
    Instant cancelDeadline,
    Instant cancelledAt,
    String cancellationReason,
    List<OrderItemResponse> items,
    String trackingNumber,
    String courierName,
    String trackingUrl,
    Instant deliveredAt,
    List<OrderTrackingEventResponse> trackingEvents,
    Boolean canReplace,
    Map<Long, OrderReplacementResponse> replacements
) {
}
