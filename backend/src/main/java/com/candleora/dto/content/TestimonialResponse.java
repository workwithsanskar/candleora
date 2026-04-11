package com.candleora.dto.content;

public record TestimonialResponse(
    Long id,
    String customerName,
    String displayDate,
    String quote,
    Integer rating,
    Integer orderIndex
) {
}
