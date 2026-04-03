package com.candleora;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CartOrderFlowIntegrationTest extends IntegrationTestSupport {

    @Test
    void cartEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/cart"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedUserCanManageCartAndPlaceOrder() throws Exception {
        String token = loginAsDemoUser();

        MvcResult addResult = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/cart/items")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "productId", 1,
                        "quantity", 2
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].productId").value(1))
            .andExpect(jsonPath("$.items[0].quantity").value(2))
            .andReturn();

        JsonNode cartPayload = objectMapper.readTree(addResult.getResponse().getContentAsString());
        long itemId = cartPayload.get("items").get(0).get("id").asLong();

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/cart/items/{itemId}", itemId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("quantity", 3)))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].quantity").value(3));

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "shippingName", "Demo Customer",
                        "phone", "9999999999",
                        "addressLine1", "123 Candle Street",
                        "addressLine2", "Suite 2",
                        "city", "Delhi",
                        "state", "Delhi",
                        "postalCode", "110001",
                        "paymentMethod", "COD",
                        "items", List.of()
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.items[0].productId").value(1));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/orders/me")
                    .header("Authorization", "Bearer " + token)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].status").value("CONFIRMED"));

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/cart")
                    .header("Authorization", "Bearer " + token)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void orderRejectsUnsupportedPaymentMethod() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "shippingName", "Demo Customer",
                        "phone", "9999999999",
                        "addressLine1", "123 Candle Street",
                        "city", "Delhi",
                        "state", "Delhi",
                        "postalCode", "110001",
                        "paymentMethod", "PAYPAL",
                        "items", List.of(Map.of(
                            "productId", 1,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Unsupported payment method"));
    }

    @Test
    void buyNowOrderDoesNotClearExistingCartItems() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/cart/items")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "productId", 1,
                        "quantity", 2
                    )))
            )
            .andExpect(status().isOk());

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/cart/items")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "productId", 2,
                        "quantity", 1
                    )))
            )
            .andExpect(status().isOk());

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header("Authorization", "Bearer " + token)
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
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.items.length()").value(1))
            .andExpect(jsonPath("$.items[0].productId").value(1));

        MvcResult cartResult = mockMvc.perform(
                MockMvcRequestBuilders.get("/api/cart")
                    .header("Authorization", "Bearer " + token)
            )
            .andExpect(status().isOk())
            .andReturn();

        JsonNode cartPayload = objectMapper.readTree(cartResult.getResponse().getContentAsString());
        assertEquals(2, cartPayload.path("items").size());
        assertEquals(2, findQuantityForProduct(cartPayload.path("items"), 1));
        assertEquals(1, findQuantityForProduct(cartPayload.path("items"), 2));
    }

    @Test
    void cancellingOrderRefreshesCatalogStock() throws Exception {
        String token = loginAsDemoUser();

        int initialStock = getCatalogStock(1);

        MvcResult orderResult = mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "shippingName", "Demo Customer",
                        "phone", "9999999999",
                        "addressLine1", "123 Candle Street",
                        "city", "Delhi",
                        "state", "Delhi",
                        "postalCode", "110001",
                        "paymentMethod", "COD",
                        "items", List.of(Map.of(
                            "productId", 1,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andReturn();

        long orderId = objectMapper.readTree(orderResult.getResponse().getContentAsString()).path("id").asLong();
        assertEquals(initialStock - 1, getCatalogStock(1));

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/orders/{orderId}/cancel", orderId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "reason", "Changed my mind"
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CANCELLED"));

        assertEquals(initialStock, getCatalogStock(1));
    }

    private int findQuantityForProduct(JsonNode items, int productId) {
        for (JsonNode item : items) {
            if (item.path("productId").asInt() == productId) {
                return item.path("quantity").asInt();
            }
        }
        return -1;
    }

    private int getCatalogStock(int productId) throws Exception {
        MvcResult productResult = mockMvc.perform(MockMvcRequestBuilders.get("/api/products/{id}", productId))
            .andExpect(status().isOk())
            .andReturn();

        return objectMapper.readTree(productResult.getResponse().getContentAsString()).path("stock").asInt();
    }
}
