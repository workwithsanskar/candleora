package com.candleora.dto.coupon;

import com.candleora.entity.CouponScope;
import com.candleora.entity.CouponType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminCouponUpdateRequest(
    String code,
    CouponType type,
    CouponScope scope,
    BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    Boolean active,
    Boolean firstOrderOnly,
    Boolean oneUsePerCustomer,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit,
    String description,
    String detailSummary,
    List<String> detailTerms,
    List<String> categorySlugs,
    List<Long> productIds
) {
}
