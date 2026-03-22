package com.candleora;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void getProductsReturnsPagedCatalogResults() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").exists())
            .andExpect(jsonPath("$.content[0].category.slug").exists())
            .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    void getProductsAppliesCategoryAndOccasionFilters() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .param("category", "flower")
                    .param("occasion", "Wedding")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].category.slug").value("flower"))
            .andExpect(jsonPath("$.content[0].occasionTag").value("Wedding"));
    }

    @Test
    void getRelatedProductsReturnsSameCategoryRecommendations() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/products/1/related"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").exists())
            .andExpect(jsonPath("$[0].category.slug").exists());
    }
}
