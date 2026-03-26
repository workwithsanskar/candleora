package com.candleora.dto.coupon;

import com.candleora.entity.CouponType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminCouponRequest(
    @NotBlank String code,
    @NotNull CouponType type,
    @NotNull @DecimalMin("0.01") BigDecimal value,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    Instant startsAt,
    Instant endsAt,
    Integer usageLimit
) {
}
