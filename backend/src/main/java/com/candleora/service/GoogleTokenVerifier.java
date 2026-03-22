package com.candleora.service;

import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenVerifier {

    private static final List<String> VALID_ISSUERS = List.of(
        "https://accounts.google.com",
        "accounts.google.com"
    );

    private final String googleClientId;
    private final JwtDecoder googleJwtDecoder;

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String googleClientId) {
        this.googleClientId = googleClientId;
        this.googleJwtDecoder = NimbusJwtDecoder
            .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .build();
    }

    public GoogleIdentity verify(String credential) {
        if (!StringUtils.hasText(googleClientId)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Google sign-in is not configured on the server"
            );
        }

        try {
            Jwt jwt = googleJwtDecoder.decode(credential);
            String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();

            if (!VALID_ISSUERS.contains(issuer)) {
                throw unauthorized();
            }

            if (jwt.getAudience() == null || !jwt.getAudience().contains(googleClientId)) {
                throw unauthorized();
            }

            if (jwt.getExpiresAt() == null || jwt.getExpiresAt().isBefore(Instant.now())) {
                throw unauthorized();
            }

            String subject = jwt.getSubject();
            String email = jwt.getClaimAsString("email");
            String name = jwt.getClaimAsString("name");
            Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");

            if (!StringUtils.hasText(subject) || !StringUtils.hasText(email)) {
                throw unauthorized();
            }

            return new GoogleIdentity(subject, name, email, Boolean.TRUE.equals(emailVerified));
        } catch (JwtException exception) {
            throw unauthorized();
        }
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google authentication failed");
    }

    public record GoogleIdentity(
        String subject,
        String name,
        String email,
        boolean emailVerified
    ) {
    }
}
