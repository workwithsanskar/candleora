package com.candleora.dto.coupon;

import com.candleora.entity.CouponType;
import java.math.BigDecimal;
import java.time.Instant;

public record CouponAdminResponse(
    Long id,
    String code,
    CouponType type,
    BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit,
    Integer usageCount
) {
}
