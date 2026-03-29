package com.candleora;

import com.candleora.entity.AuraChatEvent;
import com.candleora.entity.AuraTrainingItem;
import com.candleora.entity.AuraTrainingStatus;
import com.candleora.repository.AuraChatEventRepository;
import com.candleora.repository.AuraTrainingItemRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuraAnalyticsIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private AuraChatEventRepository auraChatEventRepository;

    @Autowired
    private AuraTrainingItemRepository auraTrainingItemRepository;

    @Test
    void unresolvedAuraQuestionCreatesTrainingItemAndEvent() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Do you host private launch events for brands?",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "wishlistItems", List.of(),
                            "cartTotal", 0,
                            "chatScope", "candleora.aura-chat:guest"
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("text"));

        List<AuraChatEvent> events = auraChatEventRepository.findAll();
        assertEquals(1, events.size());
        assertEquals("CHAT_RESPONSE", events.get(0).getEventType());
        assertFalse(events.get(0).isResolved());

        List<AuraTrainingItem> trainingItems = auraTrainingItemRepository.findAll();
        assertEquals(1, trainingItems.size());
        assertEquals(AuraTrainingStatus.OPEN, trainingItems.get(0).getStatus());
        assertTrue(trainingItems.get(0).getQuestion().contains("launch events"));
    }

    @Test
    void adminCanTrainAuraAnswerAndAuraUsesItLater() throws Exception {
        AuraTrainingItem item = new AuraTrainingItem();
        item.setQuestion("Do you host private launch events for brands?");
        item.setNormalizedQuestion("do you host private launch events for brands");
        item.setDetectedIntent("general");
        item.setPagePath("/faq");
        item.setLastAssistantMessage("I am sorry, I could not find an exact CandleOra answer for that just yet.");
        item.setStatus(AuraTrainingStatus.OPEN);
        item = auraTrainingItemRepository.save(item);
        String adminToken = loginAsAdmin();

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/analytics/aura/training/{id}", item.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "status", "TRAINED",
                        "suggestedAnswer", "Yes. Keep the candle on a stable surface, away from fabrics or direct drafts, and trim the wick before each lighting.",
                        "resolutionNotes", "Use this for pooja-corner safety questions."
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("TRAINED"));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/analytics/aura/overview")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.openTrainingItems").value(0));

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Do you host private launch events for brands?",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "wishlistItems", List.of(),
                            "cartTotal", 0,
                            "chatScope", "candleora.aura-chat:guest"
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Yes. Keep the candle on a stable surface, away from fabrics or direct drafts, and trim the wick before each lighting."));
    }
}
