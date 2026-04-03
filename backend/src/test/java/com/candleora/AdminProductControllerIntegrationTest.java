package com.candleora;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminProductControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void adminCanConfigureManualSimilarProductsForCatalogItems() throws Exception {
        String adminToken = loginAsAdmin();

        MvcResult listResult = mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .param("size", "3")
            )
            .andExpect(status().isOk())
            .andReturn();

        var productContent = objectMapper.readTree(listResult.getResponse().getContentAsString()).get("content");
        long baseProductId = productContent.get(0).get("id").asLong();
        long firstSimilarId = productContent.get(1).get("id").asLong();
        long secondSimilarId = productContent.get(2).get("id").asLong();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/admin/products/options")
                    .header("Authorization", "Bearer " + adminToken)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").exists())
            .andExpect(jsonPath("$[0].name").isNotEmpty());

        mockMvc.perform(
                MockMvcRequestBuilders.put("/api/admin/products/{id}", baseProductId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "similarProductIds", List.of(secondSimilarId, firstSimilarId)
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.similarProductIds", hasSize(2)))
            .andExpect(jsonPath("$.similarProductIds[0]").value(secondSimilarId))
            .andExpect(jsonPath("$.similarProductIds[1]").value(firstSimilarId));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/products/{id}/related", baseProductId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].id").value(secondSimilarId))
            .andExpect(jsonPath("$[1].id").value(firstSimilarId));
    }
}
