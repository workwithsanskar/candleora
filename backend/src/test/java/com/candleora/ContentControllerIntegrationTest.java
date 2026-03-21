package com.candleora;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContentControllerIntegrationTest extends IntegrationTestSupport {

    @Test
    void contentEndpointsReturnSeededContent() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/fixes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").exists());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/guides"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].slug").exists());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/faqs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].question").exists());
    }
}
