package com.candleora;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void getProductsReturnsPagedCatalogResults() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "public, max-age=60, stale-while-revalidate=300"))
            .andExpect(header().string("Server-Timing", containsString("catalog-products;dur=")))
            .andExpect(header().string("X-Response-Time", matchesPattern("\\d+ms")))
            .andExpect(jsonPath("$.content[0].id").exists())
            .andExpect(jsonPath("$.content[0].category.slug").exists())
            .andExpect(jsonPath("$.content[0].imageUrl").exists())
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
    void getProductsAcceptsCombinedOccasionFilters() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .param("occasions", "Wedding,Relaxation")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].occasionTag").isNotEmpty());
    }

    @Test
    void getRelatedProductsReturnsEmptyArrayWhenNoManualRecommendationsConfigured() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/products/1/related"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());
    }
}
