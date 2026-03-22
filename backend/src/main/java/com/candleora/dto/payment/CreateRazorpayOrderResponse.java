package com.candleora.dto.payment;

public record CreateRazorpayOrderResponse(
    Long orderId,
    String razorpayOrderId,
    Long amount,
    String currency,
    String keyId,
    String customerName,
    String customerEmail,
    String customerPhone
) {
}
