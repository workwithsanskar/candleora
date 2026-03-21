package com.candleora.service;

import com.candleora.dto.auth.AuthRequest;
import com.candleora.dto.auth.AuthResponse;
import com.candleora.dto.auth.SignupRequest;
import com.candleora.dto.auth.UserResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.Role;
import com.candleora.repository.AppUserRepository;
import com.candleora.security.JwtService;
import com.candleora.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
        AppUserRepository appUserRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        if (appUserRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        AppUser user = new AppUser();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        appUserRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        UserPrincipal principal = (UserPrincipal) authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        ).getPrincipal();

        return toAuthResponse(principal.getUser());
    }

    public UserResponse toUserResponse(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    private AuthResponse toAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpiration(token), toUserResponse(user));
    }
}
