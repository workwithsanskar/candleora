package com.candleora.controller;

import com.candleora.dto.auth.AuthRequest;
import com.candleora.dto.auth.AuthResponse;
import com.candleora.dto.auth.EmailVerificationRequest;
import com.candleora.dto.auth.GoogleAuthRequest;
import com.candleora.dto.auth.PasswordResetConfirmRequest;
import com.candleora.dto.auth.PasswordResetLinkRequest;
import com.candleora.dto.auth.PasswordResetLinkResponse;
import com.candleora.dto.auth.PhoneAuthRequest;
import com.candleora.dto.auth.SignupRequest;
import com.candleora.dto.auth.UserResponse;
import com.candleora.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
public class PublicAuthController {

    private final AuthService authService;

    public PublicAuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.googleAuth(request);
    }

    @PostMapping("/phone")
    public AuthResponse phone(@Valid @RequestBody PhoneAuthRequest request) {
        return authService.phoneAuth(request);
    }

    @PostMapping("/password-reset/request")
    public PasswordResetLinkResponse requestPasswordReset(@Valid @RequestBody PasswordResetLinkRequest request) {
        return authService.requestPasswordReset(request.email());
    }

    @PostMapping("/password-reset/confirm")
    public UserResponse confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        return authService.resetPassword(request.token(), request.password());
    }

    @PostMapping("/email-verification/verify")
    public UserResponse verifyEmail(@Valid @RequestBody EmailVerificationRequest request) {
        return authService.verifyEmail(request.token());
    }
}
