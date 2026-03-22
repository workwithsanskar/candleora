package com.candleora;

import com.candleora.entity.AppUser;
import com.candleora.entity.AuthProvider;
import com.candleora.entity.Role;
import com.candleora.repository.AppUserRepository;
import com.candleora.service.FirebaseTokenVerifier;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PhoneAuthIntegrationTest extends IntegrationTestSupport {

    @MockBean
    private FirebaseTokenVerifier firebaseTokenVerifier;

    @Autowired
    private AppUserRepository appUserRepository;

    @Test
    void publicPhoneAuthCreatesUserFromVerifiedFirebasePhoneToken() throws Exception {
        String phoneNumber = "+919876543210";
        String email = "phone-user-" + UUID.randomUUID() + "@candleora.com";

        given(firebaseTokenVerifier.verify(anyString())).willReturn(
            new FirebaseTokenVerifier.FirebaseIdentity(
                "firebase-uid-123",
                phoneNumber,
                null,
                false,
                "phone"
            )
        );

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/public/auth/phone")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new PhoneAuthBody(
                        "firebase-id-token",
                        "Phone Test User",
                        email,
                        phoneNumber
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.authProvider").value("PHONE"))
            .andExpect(jsonPath("$.user.phoneVerified").value(true))
            .andExpect(jsonPath("$.user.phoneNumber").value(phoneNumber))
            .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void publicPhoneAuthReusesExistingUserMatchedByPhoneNumber() throws Exception {
        String phoneNumber = "+919999999999";
        AppUser existingUser = new AppUser();
        existingUser.setName("Existing Phone User");
        existingUser.setEmail("existing-phone@candleora.com");
        existingUser.setPassword("encoded");
        existingUser.setRole(Role.USER);
        existingUser.setAuthProvider(AuthProvider.LOCAL);
        existingUser.setPhoneNumber(phoneNumber);
        appUserRepository.save(existingUser);

        given(firebaseTokenVerifier.verify(anyString())).willReturn(
            new FirebaseTokenVerifier.FirebaseIdentity(
                "firebase-uid-existing",
                phoneNumber,
                null,
                false,
                "phone"
            )
        );

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/public/auth/phone")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new PhoneAuthBody(
                        "firebase-existing-token",
                        "",
                        "",
                        phoneNumber
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.email").value("existing-phone@candleora.com"))
            .andExpect(jsonPath("$.user.phoneNumber").value(phoneNumber))
            .andExpect(jsonPath("$.user.authProvider").value("PHONE"))
            .andExpect(jsonPath("$.user.phoneVerified").value(true));
    }

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private record PhoneAuthBody(
        String idToken,
        String name,
        String email,
        String phoneNumber
    ) {
    }
}
