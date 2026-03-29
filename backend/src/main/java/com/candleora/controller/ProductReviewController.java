package com.candleora.controller;

import com.candleora.dto.catalog.ProductReviewRequest;
import com.candleora.dto.catalog.ProductReviewSummaryResponse;
import com.candleora.entity.AppUser;
import com.candleora.security.UserPrincipal;
import com.candleora.service.ProductReviewService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{identifier}/reviews")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    public ProductReviewController(ProductReviewService productReviewService) {
        this.productReviewService = productReviewService;
    }

    @GetMapping
    public ProductReviewSummaryResponse getReviews(
        @PathVariable String identifier,
        Authentication authentication
    ) {
        return productReviewService.getReviews(identifier, currentUser(authentication));
    }

    @PostMapping
    public ProductReviewSummaryResponse createReview(
        @PathVariable String identifier,
        Authentication authentication,
        @Valid @RequestBody ProductReviewRequest request
    ) {
        return productReviewService.createReview(identifier, request, currentUser(authentication));
    }

    private AppUser currentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }

        return principal.getUser();
    }
}
