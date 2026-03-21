package com.candleora.dto.content;

public record StylingGuideResponse(
    Long id,
    String title,
    String slug,
    String description,
    String imageUrl,
    String detailedContent
) {
}
