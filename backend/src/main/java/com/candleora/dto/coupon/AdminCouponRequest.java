package com.candleora.dto.coupon;

import com.candleora.entity.CouponScope;
import com.candleora.entity.CouponType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminCouponRequest(
    @NotBlank String code,
    @NotNull CouponType type,
    @NotNull CouponScope scope,
    @NotNull @DecimalMin("0.01") BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    boolean firstOrderOnly,
    boolean oneUsePerCustomer,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit,
    List<String> categorySlugs,
    List<Long> productIds
) {
}
