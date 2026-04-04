package com.candleora.dto.banner;

import com.candleora.entity.CouponType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminFestiveBannerRequest(
    @NotBlank String title,
    String description,
    @NotBlank String imageUrl,
    String redirectUrl,
    String ctaLabel,
    boolean autoGenerateCoupon,
    String existingCouponCode,
    CouponType discountType,
    BigDecimal discountValue,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    boolean showOnce,
    @NotNull Integer priority,
    @NotNull Instant startTime,
    @NotNull Instant endTime
) {
}
