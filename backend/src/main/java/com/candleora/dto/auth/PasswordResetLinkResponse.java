package com.candleora.dto.auth;

import java.time.Instant;

public record PasswordResetLinkResponse(
    String message,
    String previewUrl,
    Instant expiresAt,
    boolean delivered
) {
}
