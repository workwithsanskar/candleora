package com.candleora.dto.admin;

public record AuraAdminTrendPointResponse(
    String label,
    long conversations,
    long unresolvedReplies,
    long addToCartActions
) {
}
