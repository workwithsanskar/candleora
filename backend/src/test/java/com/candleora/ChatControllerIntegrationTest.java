package com.candleora;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChatControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void chatReturnsGiftRecommendationsWithoutAuthentication() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "I need a wedding gift candle",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("products"))
            .andExpect(jsonPath("$.message").isNotEmpty())
            .andExpect(jsonPath("$.data[0].name").exists())
            .andExpect(jsonPath("$.suggestions[0]").exists());
    }

    @Test
    void chatDoesNotStickToPreviousTrackOrderIntent() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Gift ideas",
                        "history", List.of(
                            Map.of("role", "user", "content", "Track order"),
                            Map.of("role", "assistant", "content", "Share your order ID and I'll look up the latest status for you."),
                            Map.of("role", "user", "content", "Gift ideas")
                        ),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("products"))
            .andExpect(jsonPath("$.data[0].name").exists());
    }

    @Test
    void chatTreatsExplicitBestSellersAsCurrentIntent() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Best sellers",
                        "history", List.of(
                            Map.of("role", "user", "content", "Gift ideas"),
                            Map.of("role", "assistant", "content", "These CandleOra picks feel especially gift-ready and easy to style for the occasion."),
                            Map.of("role", "user", "content", "Best sellers")
                        ),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("products"))
            .andExpect(jsonPath("$.message").value("These are a few CandleOra favorites customers reach for when they want a refined, dependable pick."));
    }

    @Test
    void chatReturnsCartSnapshotFromContext() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "What's in my cart",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/cart",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(Map.of(
                                "productId", 1,
                                "slug", "amber-veil",
                                "productName", "Amber Veil",
                                "imageUrl", "https://example.com/amber.jpg",
                                "occasionTag", "Evening",
                                "quantity", 2,
                                "unitPrice", 799,
                                "lineTotal", 1598
                            )),
                            "wishlistItems", List.of(),
                            "cartTotal", 1598
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("cart"))
            .andExpect(jsonPath("$.data.title").value("Your current cart"))
            .andExpect(jsonPath("$.data.totalItems").value(2))
            .andExpect(jsonPath("$.data.items[0].productName").value("Amber Veil"));
    }

    @Test
    void chatResolvesGuestOrderLookupAcrossMultipleTurns() throws Exception {
        String token = loginAsDemoUser();
        long orderId = placeCodOrder(token);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "demo@candleora.com",
                        "history", List.of(
                            Map.of("role", "user", "content", "Track order"),
                            Map.of("role", "assistant", "content", "Share your order ID and I'll look up the latest status for you."),
                            Map.of("role", "user", "content", "Order " + orderId),
                            Map.of("role", "assistant", "content", "Please share the billing email used at checkout along with the order ID."),
                            Map.of("role", "user", "content", "demo@candleora.com")
                        ),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("order"))
            .andExpect(jsonPath("$.data.id").value(orderId))
            .andExpect(jsonPath("$.data.contactEmail").value("demo@candleora.com"))
            .andExpect(jsonPath("$.data.canDownloadInvoice").value(true))
            .andExpect(jsonPath("$.data.itemCount").value(1))
            .andExpect(jsonPath("$.data.items[0].productName").isNotEmpty());
    }

    @Test
    void chatReturnsOrderSnapshotForAuthenticatedUser() throws Exception {
        String token = loginAsDemoUser();
        long orderId = placeCodOrder(token);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Track order " + orderId,
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/orders",
                            "authenticated", true,
                            "customerName", "Demo Customer",
                            "cartItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("order"))
            .andExpect(jsonPath("$.data.id").value(orderId))
            .andExpect(jsonPath("$.data.status").isNotEmpty())
            .andExpect(jsonPath("$.data.canDownloadInvoice").isBoolean())
            .andExpect(jsonPath("$.data.items[0].productName").isNotEmpty())
            .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void trackedGuestCanDownloadInvoiceWithBillingEmail() throws Exception {
        String token = loginAsDemoUser();
        long orderId = placeCodOrder(token);

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/{orderId}/invoice/tracking", orderId)
                    .param("email", "demo@candleora.com")
            )
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")));
    }

    @Test
    void chatAnswersCandleOraStoryQuestions() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "Tell me about CandleOra",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/about",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "wishlistItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("text"))
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("artists and designers")));
    }

    @Test
    void chatReturnsDirectContactActions() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "message", "How do I contact CandleOra?",
                        "history", List.of(),
                        "context", Map.of(
                            "pagePath", "/faq",
                            "authenticated", false,
                            "customerName", "",
                            "cartItems", List.of(),
                            "wishlistItems", List.of(),
                            "cartTotal", 0
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.type").value("text"))
            .andExpect(jsonPath("$.message").value(containsString("candleora25@gmail.com")))
            .andExpect(jsonPath("$.actions[0].label").value("Call CandleOra"))
            .andExpect(jsonPath("$.actions[0].type").value("open_link"))
            .andExpect(jsonPath("$.actions[0].href").value("tel:+918999908639"))
            .andExpect(jsonPath("$.actions[1].href").value("mailto:candleora25@gmail.com"))
            .andExpect(jsonPath("$.actions[2].href").value("https://wa.me/918999908639"));
    }

    private long placeCodOrder(String token) throws Exception {
        MvcResult result = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "shippingName", "Demo Customer",
                        "phone", "9999999999",
                        "contactEmail", "demo@candleora.com",
                        "addressLine1", "12 Glow Street",
                        "city", "Noida",
                        "state", "UP",
                        "postalCode", "201301",
                        "country", "India",
                        "paymentMethod", "COD",
                        "items", List.of(Map.of(
                            "productId", 1,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
        return payload.get("id").asLong();
    }
}
