package com.candleora;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void signupReturnsTokenAndUserPayload() throws Exception {
        String email = "user-" + UUID.randomUUID() + "@candleora.com";

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new SignupBody(
                        "Test User",
                        email,
                        "Password123!"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.email").value(email))
            .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void publicSignupReturnsTokenAndUserPayload() throws Exception {
        String email = "public-user-" + UUID.randomUUID() + "@candleora.com";

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/public/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new SignupBody(
                        "Public Test User",
                        email,
                        "Password123!"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.email").value(email))
            .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void loginReturnsTokenAndAllowsAccessToProfileEndpoint() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/auth/me")
                    .header("Authorization", "Bearer " + token)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("demo@candleora.com"))
            .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void publicLoginReturnsTokenAndAllowsAccessToProfileEndpoint() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/public/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new LoginBody(
                        "demo@candleora.com",
                        "Password123!"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isString())
            .andExpect(jsonPath("$.user.email").value("demo@candleora.com"))
            .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void profileUpdateAllowsBasicsOnlyPayload() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/auth/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new ProfileUpdateBody(
                        "Aura Stone",
                        "9999999999",
                        "Female",
                        "1996-03-14"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Aura Stone"))
            .andExpect(jsonPath("$.phoneNumber").value("9999999999"))
            .andExpect(jsonPath("$.gender").value("Female"));
    }

    private record SignupBody(String name, String email, String password) {
    }

    private record LoginBody(String email, String password) {
    }

    private record ProfileUpdateBody(
        String name,
        String phoneNumber,
        String gender,
        String dateOfBirth
    ) {
    }
}
