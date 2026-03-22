package com.candleora.service;

import com.candleora.dto.auth.AuthRequest;
import com.candleora.dto.auth.AuthResponse;
import com.candleora.dto.auth.GoogleAuthRequest;
import com.candleora.dto.auth.PhoneAuthRequest;
import com.candleora.dto.auth.ProfileUpdateRequest;
import com.candleora.dto.auth.SignupRequest;
import com.candleora.dto.auth.UserResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.AuthProvider;
import com.candleora.entity.Role;
import com.candleora.repository.AppUserRepository;
import com.candleora.security.JwtService;
import com.candleora.security.UserPrincipal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    public AuthService(
        AppUserRepository appUserRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        GoogleTokenVerifier googleTokenVerifier,
        FirebaseTokenVerifier firebaseTokenVerifier
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
    }

    public AuthResponse signup(SignupRequest request) {
        if (appUserRepository.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        AppUser user = new AppUser();
        user.setName(trimToNull(request.name()));
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setPhoneVerified(false);
        applyProfileFields(
            user,
            request.phoneNumber(),
            request.alternatePhoneNumber(),
            request.addressLine1(),
            request.addressLine2(),
            request.city(),
            request.state(),
            request.postalCode(),
            request.gender(),
            request.dateOfBirth(),
            request.locationLabel(),
            request.latitude(),
            request.longitude()
        );
        appUserRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(AuthRequest request) {
        UserPrincipal principal = (UserPrincipal) authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        ).getPrincipal();

        return toAuthResponse(principal.getUser());
    }

    public AuthResponse googleAuth(GoogleAuthRequest request) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(request.credential());

        AppUser user = appUserRepository.findByGoogleSubject(identity.subject())
            .or(() -> appUserRepository.findByEmailIgnoreCase(identity.email()))
            .orElseGet(AppUser::new);

        boolean isNewUser = user.getId() == null;

        user.setName(firstNonBlank(request.name(), user.getName(), identity.name(), identity.email()));
        user.setEmail(identity.email());
        user.setEmailVerified(identity.emailVerified());
        user.setGoogleSubject(identity.subject());
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setRole(user.getRole() == null ? Role.USER : user.getRole());

        if (isNewUser) {
            user.setPassword(passwordEncoder.encode("google-" + UUID.randomUUID()));
        }

        mergeProfileFields(
            user,
            request.phoneNumber(),
            request.alternatePhoneNumber(),
            request.addressLine1(),
            request.addressLine2(),
            request.city(),
            request.state(),
            request.postalCode(),
            request.gender(),
            request.dateOfBirth(),
            request.locationLabel(),
            request.latitude(),
            request.longitude()
        );

        appUserRepository.save(user);
        return toAuthResponse(user);
    }

    public AuthResponse phoneAuth(PhoneAuthRequest request) {
        FirebaseTokenVerifier.FirebaseIdentity identity = firebaseTokenVerifier.verify(request.idToken());
        Optional<AppUser> matchedUser = appUserRepository.findByFirebaseUid(identity.uid());

        if (matchedUser.isEmpty()) {
            matchedUser = appUserRepository.findByPhoneNumber(identity.phoneNumber());
        }

        String requestedEmail = firstNonBlank(request.email(), identity.email());
        if (matchedUser.isEmpty() && requestedEmail != null) {
            matchedUser = appUserRepository.findByEmailIgnoreCase(requestedEmail);
        }

        AppUser user = matchedUser.orElseGet(AppUser::new);
        boolean isNewUser = user.getId() == null;

        user.setName(firstNonBlank(request.name(), user.getName(), "CandleOra Customer"));
        user.setFirebaseUid(identity.uid());
        user.setPhoneNumber(firstNonBlank(identity.phoneNumber(), request.phoneNumber(), user.getPhoneNumber()));
        user.setPhoneVerified(true);
        user.setAuthProvider(AuthProvider.PHONE);
        user.setRole(user.getRole() == null ? Role.USER : user.getRole());
        user.setEmailVerified(identity.emailVerified() || user.isEmailVerified());
        user.setEmail(firstNonBlank(requestedEmail, user.getEmail(), placeholderEmail(identity.uid())));

        if (isNewUser) {
            user.setPassword(passwordEncoder.encode("phone-" + UUID.randomUUID()));
        }

        mergeProfileFields(
            user,
            request.phoneNumber(),
            request.alternatePhoneNumber(),
            request.addressLine1(),
            request.addressLine2(),
            request.city(),
            request.state(),
            request.postalCode(),
            request.gender(),
            request.dateOfBirth(),
            request.locationLabel(),
            request.latitude(),
            request.longitude()
        );

        appUserRepository.save(user);
        return toAuthResponse(user);
    }

    public UserResponse updateProfile(AppUser user, ProfileUpdateRequest request) {
        user.setName(firstNonBlank(request.name(), user.getName()));
        applyProfileFields(
            user,
            request.phoneNumber(),
            request.alternatePhoneNumber(),
            request.addressLine1(),
            request.addressLine2(),
            request.city(),
            request.state(),
            request.postalCode(),
            request.gender(),
            request.dateOfBirth(),
            request.locationLabel(),
            request.latitude(),
            request.longitude()
        );
        return toUserResponse(appUserRepository.save(user));
    }

    public UserResponse toUserResponse(AppUser user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            (user.getRole() == null ? Role.USER : user.getRole()).name(),
            (user.getAuthProvider() == null ? AuthProvider.LOCAL : user.getAuthProvider()).name(),
            user.isEmailVerified(),
            user.isPhoneVerified(),
            user.getPhoneNumber(),
            user.getAlternatePhoneNumber(),
            user.getAddressLine1(),
            user.getAddressLine2(),
            user.getCity(),
            user.getState(),
            user.getPostalCode(),
            user.getGender(),
            user.getDateOfBirth(),
            user.getLocationLabel(),
            user.getLatitude(),
            user.getLongitude(),
            user.getCreatedAt()
        );
    }

    private AuthResponse toAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, jwtService.getExpiration(token), toUserResponse(user));
    }

    private void applyProfileFields(
        AppUser user,
        String phoneNumber,
        String alternatePhoneNumber,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String gender,
        LocalDate dateOfBirth,
        String locationLabel,
        Double latitude,
        Double longitude
    ) {
        user.setPhoneNumber(trimToNull(phoneNumber));
        user.setAlternatePhoneNumber(trimToNull(alternatePhoneNumber));
        user.setAddressLine1(trimToNull(addressLine1));
        user.setAddressLine2(trimToNull(addressLine2));
        user.setCity(trimToNull(city));
        user.setState(trimToNull(state));
        user.setPostalCode(trimToNull(postalCode));
        user.setGender(trimToNull(gender));
        user.setDateOfBirth(dateOfBirth);
        user.setLocationLabel(trimToNull(locationLabel));
        user.setLatitude(latitude);
        user.setLongitude(longitude);
    }

    private void mergeProfileFields(
        AppUser user,
        String phoneNumber,
        String alternatePhoneNumber,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String gender,
        LocalDate dateOfBirth,
        String locationLabel,
        Double latitude,
        Double longitude
    ) {
        if (phoneNumber != null) {
            user.setPhoneNumber(trimToNull(phoneNumber));
        }
        if (alternatePhoneNumber != null) {
            user.setAlternatePhoneNumber(trimToNull(alternatePhoneNumber));
        }
        if (addressLine1 != null) {
            user.setAddressLine1(trimToNull(addressLine1));
        }
        if (addressLine2 != null) {
            user.setAddressLine2(trimToNull(addressLine2));
        }
        if (city != null) {
            user.setCity(trimToNull(city));
        }
        if (state != null) {
            user.setState(trimToNull(state));
        }
        if (postalCode != null) {
            user.setPostalCode(trimToNull(postalCode));
        }
        if (gender != null) {
            user.setGender(trimToNull(gender));
        }
        if (dateOfBirth != null) {
            user.setDateOfBirth(dateOfBirth);
        }
        if (locationLabel != null) {
            user.setLocationLabel(trimToNull(locationLabel));
        }
        if (latitude != null) {
            user.setLatitude(latitude);
        }
        if (longitude != null) {
            user.setLongitude(longitude);
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            String trimmed = trimToNull(value);
            if (trimmed != null) {
                return trimmed;
            }
        }
        return null;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String placeholderEmail(String uid) {
        return "phone-" + uid + "@auth.candleora.local";
    }
}
