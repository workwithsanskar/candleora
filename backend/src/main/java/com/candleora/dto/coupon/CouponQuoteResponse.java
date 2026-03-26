package com.candleora.dto.coupon;

import java.math.BigDecimal;

public record CouponQuoteResponse(
    String code,
    BigDecimal subtotalAmount,
    BigDecimal discountAmount,
    BigDecimal totalAmount,
    String message
) {
}
