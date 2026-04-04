package com.candleora.dto.banner;

import java.time.Instant;

public record FestiveBannerPopupResponse(
    Long id,
    String title,
    String description,
    String imageUrl,
    String redirectUrl,
    String ctaLabel,
    String couponCode,
    boolean showOnce,
    Instant endTime
) {
}
