package com.candleora.dto.content;

public record FaqResponse(
    Long id,
    String question,
    String answer,
    Integer orderIndex
) {
}
