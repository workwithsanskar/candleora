package com.candleora.service;

import java.time.Instant;
import java.util.Map;
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
public class FirebaseTokenVerifier {

    private final String projectId;
    private final JwtDecoder firebaseJwtDecoder;

    public FirebaseTokenVerifier(@Value("${app.firebase.project-id:}") String projectId) {
        this.projectId = projectId;
        this.firebaseJwtDecoder = NimbusJwtDecoder
            .withJwkSetUri("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
            .build();
    }

    public FirebaseIdentity verify(String idToken) {
        if (!StringUtils.hasText(projectId)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Phone authentication is not configured on the server"
            );
        }

        try {
            Jwt jwt = firebaseJwtDecoder.decode(idToken);
            String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
            String expectedIssuer = "https://securetoken.google.com/" + projectId;

            if (!expectedIssuer.equals(issuer)) {
                throw unauthorized();
            }

            if (jwt.getAudience() == null || !jwt.getAudience().contains(projectId)) {
                throw unauthorized();
            }

            if (jwt.getExpiresAt() == null || jwt.getExpiresAt().isBefore(Instant.now())) {
                throw unauthorized();
            }

            String uid = jwt.getSubject();
            String phoneNumber = jwt.getClaimAsString("phone_number");
            String email = jwt.getClaimAsString("email");
            Boolean emailVerified = jwt.getClaimAsBoolean("email_verified");
            Map<String, Object> firebase = jwt.getClaim("firebase");
            String signInProvider = firebase == null ? null : String.valueOf(firebase.get("sign_in_provider"));

            if (!StringUtils.hasText(uid) || !StringUtils.hasText(phoneNumber)) {
                throw unauthorized();
            }

            return new FirebaseIdentity(
                uid,
                phoneNumber,
                email,
                Boolean.TRUE.equals(emailVerified),
                signInProvider
            );
        } catch (JwtException exception) {
            throw unauthorized();
        }
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phone authentication failed");
    }

    public record FirebaseIdentity(
        String uid,
        String phoneNumber,
        String email,
        boolean emailVerified,
        String signInProvider
    ) {
    }
}
