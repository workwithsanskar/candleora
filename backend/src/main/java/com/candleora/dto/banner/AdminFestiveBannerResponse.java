package com.candleora.dto.banner;

import com.candleora.entity.CouponType;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminFestiveBannerResponse(
    Long id,
    String title,
    String description,
    String imageUrl,
    String redirectUrl,
    String ctaLabel,
    boolean autoGenerateCoupon,
    Long couponId,
    String couponCode,
    CouponType discountType,
    BigDecimal discountValue,
    BigDecimal maxDiscount,
    BigDecimal minOrderAmount,
    boolean active,
    boolean showOnce,
    Integer priority,
    Instant startTime,
    Instant endTime,
    Instant createdAt,
    Instant updatedAt
) {
}
