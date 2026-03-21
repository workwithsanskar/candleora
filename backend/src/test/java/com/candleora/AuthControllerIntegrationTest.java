package com.candleora;

import java.util.UUID;
import org.junit.jupiter.api.Test;
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

    private record SignupBody(String name, String email, String password) {
    }
}
