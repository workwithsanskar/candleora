package com.candleora.dto.content;

public record AnnouncementResponse(
    Long id,
    String message,
    Integer orderIndex
) {
}
