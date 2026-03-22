package com.candleora.security;

import com.candleora.entity.AppUser;
import com.candleora.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    @Test
    void generateTokenSupportsShortPlainTextSecrets() {
        JwtService jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "short-dev-secret");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 86400000L);

        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", 42L);
        user.setName("Test User");
        user.setRole(Role.USER);

        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("42");
        assertThat(jwtService.getExpiration(token)).isAfter(java.time.Instant.now());
    }
}
