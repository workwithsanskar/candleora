package com.candleora;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminContactMessagesIntegrationTest extends IntegrationTestSupport {

    @Test
    void adminCanViewStoredContactMessages() throws Exception {
        String adminToken = loginAsAdmin();

        MvcResult createResult = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/contact")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "name", "Aarav Kapoor",
                        "email", "aarav@example.com",
                        "phone", "9876543210",
                        "subject", "Bulk gifting query",
                        "message", "Need 120 candles for a wedding welcome kit."
                    )))
            )
            .andExpect(status().isOk())
            .andReturn();

        long messageId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/contact-messages")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("search", "bulk gifting")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].name").value("Aarav Kapoor"))
            .andExpect(jsonPath("$.content[0].subject").value("Bulk gifting query"))
            .andExpect(jsonPath("$.content[0].message").value("Need 120 candles for a wedding welcome kit."));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/contact-messages")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("reviewed", "false")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].email").value("aarav@example.com"));

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/contact-messages/{id}/reviewed", messageId)
                    .header("Authorization", "Bearer " + adminToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.adminReviewedAt").isNotEmpty());

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/contact-messages")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("reviewed", "true")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].adminReviewedAt").isNotEmpty());
    }
}
