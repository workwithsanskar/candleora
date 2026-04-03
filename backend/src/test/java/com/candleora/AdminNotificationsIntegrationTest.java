package com.candleora;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminNotificationsIntegrationTest extends IntegrationTestSupport {

    @Test
    void adminNotificationFeedReturnsUnreadItemsAndSupportsMarkAllReviewed() throws Exception {
        String adminToken = loginAsAdmin();

        mockMvc.perform(
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
            .andExpect(status().isOk());

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/notifications")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("limit", "5")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.unreadContactMessages").value(1))
            .andExpect(jsonPath("$.totalUnread").value(1))
            .andExpect(jsonPath("$.items[0].type").value("CONTACT"));

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/admin/notifications/review-all")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("limit", "5")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalUnread").value(0))
            .andExpect(jsonPath("$.items").isEmpty());
    }
}
