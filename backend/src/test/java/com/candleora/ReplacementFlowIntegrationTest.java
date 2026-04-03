package com.candleora;

import com.candleora.entity.Product;
import com.candleora.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReplacementFlowIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private ProductRepository productRepository;

    @Test
    void deliveredOrderSupportsPublicTrackingAndReplacementCreation() throws Exception {
        String userToken = loginAsDemoUser();
        String adminToken = loginAsAdmin();

        OrderFixture deliveredOrder = createDeliveredOrder(userToken, adminToken, 1);

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/{orderId}/tracking", deliveredOrder.orderId())
                    .param("email", "demo@candleora.com")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(deliveredOrder.orderId()))
            .andExpect(jsonPath("$.status").value("DELIVERED"))
            .andExpect(jsonPath("$.canReplace").value(true));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/{orderId}/tracking", deliveredOrder.orderId())
                    .param("email", "wrong@example.com")
            )
            .andExpect(status().isNotFound());

        MvcResult replacementResult = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders/{orderId}/replace", deliveredOrder.orderId())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "orderItemId", deliveredOrder.orderItemId(),
                        "reason", "Damaged product",
                        "customerNote", "The candle jar arrived cracked."
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderId").value(deliveredOrder.orderId()))
            .andExpect(jsonPath("$.status").value("REQUESTED"))
            .andExpect(jsonPath("$.isFraudSuspected").value(true))
            .andReturn();

        long replacementId = objectMapper.readTree(replacementResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/replacements")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("fraud", "true")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].orderId").value(deliveredOrder.orderId()))
            .andExpect(jsonPath("$.content[0].status").value("REQUESTED"));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/replacements")
                    .header("Authorization", "Bearer " + adminToken)
                    .param("reviewed", "false")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].orderId").value(deliveredOrder.orderId()));

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/replacements/{id}/reviewed", replacementId)
                    .header("Authorization", "Bearer " + adminToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.adminReviewedAt").isNotEmpty());
    }

    @Test
    void adminCanBulkApproveReplacementRequestsAndReserveInventory() throws Exception {
        String userToken = loginAsDemoUser();
        String adminToken = loginAsAdmin();

        OrderFixture firstOrder = createDeliveredOrder(userToken, adminToken, 1);
        OrderFixture secondOrder = createDeliveredOrder(userToken, adminToken, 2);

        long firstReplacementId = createReplacement(userToken, firstOrder.orderId(), firstOrder.orderItemId(), "Wrong item");
        long secondReplacementId = createReplacement(userToken, secondOrder.orderId(), secondOrder.orderItemId(), "Defective");

        Product firstProductBeforeApproval = productRepository.findById(1L).orElseThrow();
        Product secondProductBeforeApproval = productRepository.findById(2L).orElseThrow();
        int firstReservedBefore = firstProductBeforeApproval.getReservedStock();
        int secondReservedBefore = secondProductBeforeApproval.getReservedStock();

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/admin/replacements/bulk-approve")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "ids", List.of(firstReplacementId, secondReplacementId),
                        "adminNote", "Approved after image review"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("APPROVED"))
            .andExpect(jsonPath("$[1].status").value("APPROVED"));

        Product firstProductAfterApproval = productRepository.findById(1L).orElseThrow();
        Product secondProductAfterApproval = productRepository.findById(2L).orElseThrow();

        assertEquals(firstReservedBefore + 1, firstProductAfterApproval.getReservedStock());
        assertEquals(secondReservedBefore + 1, secondProductAfterApproval.getReservedStock());
    }

    @Test
    void replacementCanOnlyBeRequestedOncePerOrderItem() throws Exception {
        String userToken = loginAsDemoUser();
        String adminToken = loginAsAdmin();

        OrderFixture deliveredOrder = createDeliveredOrder(userToken, adminToken, 1);
        createReplacement(userToken, deliveredOrder.orderId(), deliveredOrder.orderItemId(), "Damaged product");

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders/{orderId}/replace", deliveredOrder.orderId())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "orderItemId", deliveredOrder.orderItemId(),
                        "reason", "Broken item",
                        "proofImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"
                    )))
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Only one replacement request is allowed for this item"));
    }

    private long createReplacement(String userToken, long orderId, long orderItemId, String reason) throws Exception {
        MvcResult result = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders/{orderId}/replace", orderId)
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "orderItemId", orderItemId,
                        "reason", reason,
                        "proofImageUrl", "https://res.cloudinary.com/demo/image/upload/sample.jpg"
                    )))
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString());
        return payload.get("id").asLong();
    }

    private OrderFixture createDeliveredOrder(String userToken, String adminToken, int productId) throws Exception {
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
                            "productId", productId,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode orderPayload = objectMapper.readTree(orderResult.getResponse().getContentAsString());
        long orderId = orderPayload.get("id").asLong();
        long orderItemId = orderPayload.path("items").get(0).get("id").asLong();

        MvcResult deliveredResult = mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/orders/{id}/status", orderId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("status", "DELIVERED")))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DELIVERED"))
            .andReturn();

        JsonNode deliveredPayload = objectMapper.readTree(deliveredResult.getResponse().getContentAsString());
        assertNotNull(deliveredPayload.get("createdAt"));

        return new OrderFixture(orderId, orderItemId);
    }

    private record OrderFixture(long orderId, long orderItemId) {
    }
}
