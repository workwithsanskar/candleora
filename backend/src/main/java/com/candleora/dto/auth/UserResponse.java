package com.candleora.dto.auth;

public record UserResponse(
    Long id,
    String name,
    String email,
    String role
) {
}
