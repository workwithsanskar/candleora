package com.candleora.dto.coupon;

import java.time.Instant;

public record CouponOfferResponse(
    String code,
    String title,
    String description,
    String eligibilityHint,
    Instant expiresAt,
    String expiryText
) {
}
