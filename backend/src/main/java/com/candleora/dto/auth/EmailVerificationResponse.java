package com.candleora.dto.auth;

import java.time.Instant;

public record EmailVerificationResponse(
    String message,
    String previewUrl,
    Instant expiresAt,
    boolean deliveryConfigured
) {
}
