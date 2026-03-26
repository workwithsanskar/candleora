package com.candleora.dto.payment;

public record CreatePhonePePaymentResponse(
    Long orderId,
    String merchantTransactionId,
    String checkoutUrl
) {
}
