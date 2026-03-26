package com.candleora.controller;

import com.candleora.dto.auth.AuthRequest;
import com.candleora.dto.auth.AuthResponse;
import com.candleora.dto.auth.EmailVerificationResponse;
import com.candleora.dto.auth.GoogleAuthRequest;
import com.candleora.dto.auth.PhoneAuthRequest;
import com.candleora.dto.auth.ProfileUpdateRequest;
import com.candleora.dto.auth.SignupRequest;
import com.candleora.dto.auth.UserResponse;
import com.candleora.entity.AppUser;
import com.candleora.security.UserPrincipal;
import com.candleora.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
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

    @PostMapping("/email-verification/send")
    public EmailVerificationResponse sendEmailVerification(Authentication authentication) {
        AppUser user = ((UserPrincipal) authentication.getPrincipal()).getUser();
        return authService.sendEmailVerification(user);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return authService.toUserResponse(principal.getUser());
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(
        Authentication authentication,
        @RequestBody ProfileUpdateRequest request
    ) {
        AppUser user = ((UserPrincipal) authentication.getPrincipal()).getUser();
        return authService.updateProfile(user, request);
    }

    @PutMapping("/me")
    public UserResponse updateMe(
        Authentication authentication,
        @RequestBody ProfileUpdateRequest request
    ) {
        AppUser user = ((UserPrincipal) authentication.getPrincipal()).getUser();
        return authService.updateProfile(user, request);
    }
}
