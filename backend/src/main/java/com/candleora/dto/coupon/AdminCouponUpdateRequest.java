package com.candleora.dto.coupon;

import com.candleora.entity.CouponType;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminCouponUpdateRequest(
    String code,
    CouponType type,
    BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    Boolean active,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit
) {
}
