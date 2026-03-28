package com.candleora.dto.coupon;

import com.candleora.entity.CouponScope;
import com.candleora.entity.CouponType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CouponAdminResponse(
    Long id,
    String code,
    CouponType type,
    CouponScope scope,
    BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    boolean firstOrderOnly,
    boolean oneUsePerCustomer,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit,
    Integer usageCount,
    List<String> categorySlugs,
    List<Long> productIds
) {
}
