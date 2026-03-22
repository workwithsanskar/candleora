package com.candleora;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CorsIntegrationTest extends IntegrationTestSupport {

    @Test
    void preflightAllowsProductionOrigin() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.options("/api/products")
                    .header(HttpHeaders.ORIGIN, "https://candleora.vercel.app")
                    .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.GET.name())
            )
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://candleora.vercel.app"));
    }

    @Test
    void getAllowsProductionOrigin() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .header(HttpHeaders.ORIGIN, "https://candleora.vercel.app")
            )
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://candleora.vercel.app"));
    }

    @Test
    void getAllowsLocalDevelopmentOrigin() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .header(HttpHeaders.ORIGIN, "http://localhost:5173")
            )
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }

    @Test
    void getAllowsPreviewOriginPattern() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .header(HttpHeaders.ORIGIN, "https://preview-123.vercel.app")
            )
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://preview-123.vercel.app"));
    }

    @Test
    void getRejectsUnknownOrigin() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products")
                    .header(HttpHeaders.ORIGIN, "https://evil.example.com")
            )
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
