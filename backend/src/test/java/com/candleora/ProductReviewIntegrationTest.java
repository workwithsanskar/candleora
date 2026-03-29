package com.candleora;

import com.candleora.entity.AppUser;
import com.candleora.entity.Product;
import com.candleora.entity.ProductReview;
import com.candleora.repository.AppUserRepository;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ProductReviewRepository;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductReviewIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductReviewRepository productReviewRepository;

    @Test
    void createReviewRequiresAuthentication() throws Exception {
        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/products/1/reviews")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reviewPayload()))
            )
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void createReviewUsesSignedInAccountAndPreventsDuplicates() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/products/1/reviews")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "reviewerName", "Spoofed Name",
                        "reviewerEmail", "spoofed@example.com",
                        "rating", 5,
                        "message", "Burned evenly and smelled beautiful."
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reviewCount").value(1))
            .andExpect(jsonPath("$.reviews[0].reviewerName").value("Demo Customer"))
            .andExpect(jsonPath("$.currentUserReview.reviewerName").value("Demo Customer"))
            .andExpect(jsonPath("$.currentUserReview.message").value("Burned evenly and smelled beautiful."));

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/products/1/reviews")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reviewPayload()))
            )
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("You have already reviewed this product"));
    }

    @Test
    void getReviewsIncludesCurrentUsersReviewWhenAuthenticated() throws Exception {
        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/products/1/reviews")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(reviewPayload()))
            )
            .andExpect(status().isOk());

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products/1/reviews")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reviewCount").value(1))
            .andExpect(jsonPath("$.currentUserReview.reviewerName").value("Demo Customer"))
            .andExpect(jsonPath("$.currentUserReview.rating").value(5));
    }

    @Test
    void getReviewsBackfillsLegacyEmailMatchedReviewToSignedInUser() throws Exception {
        AppUser demoUser = appUserRepository.findByEmailIgnoreCase("demo@candleora.com")
            .orElseThrow();
        Product product = productRepository.findById(1L).orElseThrow();

        ProductReview legacyReview = new ProductReview();
        legacyReview.setProduct(product);
        legacyReview.setReviewerName("Older Demo Name");
        legacyReview.setReviewerEmail("demo@candleora.com");
        legacyReview.setRating(4);
        legacyReview.setMessage("Legacy review still belongs to this account.");
        productReviewRepository.save(legacyReview);

        String token = loginAsDemoUser();

        mockMvc.perform(
                MockMvcRequestBuilders.get("/api/products/1/reviews")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken(token))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reviewCount").value(1))
            .andExpect(jsonPath("$.currentUserReview.message").value("Legacy review still belongs to this account."));

        ProductReview updatedReview = productReviewRepository.findById(legacyReview.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertNotNull(updatedReview.getReviewerUser());
        org.junit.jupiter.api.Assertions.assertEquals(demoUser.getId(), updatedReview.getReviewerUser().getId());
    }

    private Map<String, Object> reviewPayload() {
        return Map.of(
            "reviewerName", "Demo Customer",
            "reviewerEmail", "demo@candleora.com",
            "rating", 5,
            "message", "Beautiful candle with a clean burn."
        );
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }
}
