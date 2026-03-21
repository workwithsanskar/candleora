package com.candleora.dto.content;

public record CandleFixResponse(
    Long id,
    String title,
    String cause,
    String fixSteps,
    String videoUrl,
    String beforeImage,
    String afterImage
) {
}
