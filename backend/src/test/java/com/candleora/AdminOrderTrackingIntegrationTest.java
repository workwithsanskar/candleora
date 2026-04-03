package com.candleora;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminOrderTrackingIntegrationTest extends IntegrationTestSupport {

    @Test
    void adminManagedTrackingTimelineFeedsCustomerAndPublicTrackingViews() throws Exception {
        String userToken = loginAsDemoUser();
        String adminToken = loginAsAdmin();

        MvcResult orderResult = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "shippingName", "Demo Customer",
                        "phone", "9999999999",
                        "addressLine1", "123 Candle Street",
                        "city", "Delhi",
                        "state", "Delhi",
                        "postalCode", "110001",
                        "paymentMethod", "COD",
                        "checkoutSource", "BUY_NOW",
                        "items", List.of(Map.of(
                            "productId", 1,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode orderPayload = objectMapper.readTree(orderResult.getResponse().getContentAsString());
        long orderId = orderPayload.get("id").asLong();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/orders")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("reviewed", "false")
                    .param("search", String.valueOf(orderId))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(orderId));

        Instant confirmedAt = Instant.now().minusSeconds(7200);
        Instant shippedAt = Instant.now().minusSeconds(3600);
        Instant outForDeliveryAt = Instant.now().minusSeconds(900);

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/orders/{id}/tracking", orderId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "trackingNumber", "CANDLE-TRACK-101",
                        "courierName", "CandleOra rider",
                        "trackingUrl", "",
                        "events", List.of(
                            Map.of(
                                "status", "CONFIRMED",
                                "timestamp", confirmedAt,
                                "detail", "Order verified and moved to the studio queue."
                            ),
                            Map.of(
                                "status", "SHIPPED",
                                "timestamp", shippedAt,
                                "detail", "Handed to the in-house delivery rider."
                            ),
                            Map.of(
                                "status", "OUT_FOR_DELIVERY",
                                "timestamp", outForDeliveryAt,
                                "detail", "Rider is on the final route."
                            )
                        )
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
            .andExpect(jsonPath("$.trackingNumber").value("CANDLE-TRACK-101"))
            .andExpect(jsonPath("$.courierName").value("CandleOra rider"))
            .andExpect(jsonPath("$.trackingEvents[0].status").value("CONFIRMED"))
            .andExpect(jsonPath("$.trackingEvents[1].status").value("SHIPPED"))
            .andExpect(jsonPath("$.trackingEvents[2].status").value("OUT_FOR_DELIVERY"));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/{orderId}", orderId)
                    .header("Authorization", "Bearer " + userToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
            .andExpect(jsonPath("$.trackingNumber").value("CANDLE-TRACK-101"))
            .andExpect(jsonPath("$.trackingEvents[1].detail").value("Handed to the in-house delivery rider."));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/{orderId}/tracking", orderId)
                    .param("email", "demo@candleora.com")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"))
            .andExpect(jsonPath("$.trackingEvents[2].detail").value("Rider is on the final route."));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/orders")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("reviewed", "true")
                    .param("search", String.valueOf(orderId))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(orderId));

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/orders/{id}/reviewed", orderId)
                    .header("Authorization", "Bearer " + adminToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.adminReviewedAt").isNotEmpty());
    }
}
