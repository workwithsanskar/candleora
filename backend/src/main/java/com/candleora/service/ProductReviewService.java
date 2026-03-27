package com.candleora.service;

import com.candleora.dto.catalog.ProductReviewRequest;
import com.candleora.dto.catalog.ProductReviewResponse;
import com.candleora.dto.catalog.ProductReviewSummaryResponse;
import com.candleora.entity.Product;
import com.candleora.entity.ProductReview;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ProductReviewRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductReviewService {

    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;

    public ProductReviewService(
        ProductRepository productRepository,
        ProductReviewRepository productReviewRepository
    ) {
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
    }

    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getReviews(String identifier) {
        Product product = findVisibleProduct(identifier);
        return buildSummary(product);
    }

    @Transactional
    public ProductReviewSummaryResponse createReview(String identifier, ProductReviewRequest request) {
        Product product = findVisibleProduct(identifier);

        ProductReview review = new ProductReview();
        review.setProduct(product);
        review.setReviewerName(request.reviewerName().trim());
        review.setReviewerEmail(request.reviewerEmail().trim().toLowerCase(Locale.ROOT));
        review.setRating(request.rating());
        review.setMessage(request.message().trim());
        productReviewRepository.save(review);

        ProductReviewSummaryResponse summary = buildSummary(product);
        product.setRating(summary.averageRating());
        productRepository.save(product);

        return summary;
    }

    private ProductReviewSummaryResponse buildSummary(Product product) {
        List<ProductReview> reviews = productReviewRepository.findAllByProductIdOrderByCreatedAtDescIdDesc(product.getId());
        BigDecimal averageRating = reviews.isEmpty()
            ? fallbackRating(product.getRating())
            : calculateAverage(reviews);

        return new ProductReviewSummaryResponse(
            averageRating,
            reviews.size(),
            reviews.stream().map(this::toResponse).toList()
        );
    }

    private ProductReviewResponse toResponse(ProductReview review) {
        return new ProductReviewResponse(
            review.getId(),
            review.getReviewerName(),
            review.getRating(),
            review.getMessage(),
            review.getCreatedAt()
        );
    }

    private BigDecimal calculateAverage(List<ProductReview> reviews) {
        BigDecimal total = reviews.stream()
            .map(review -> BigDecimal.valueOf(review.getRating()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return total.divide(BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal fallbackRating(BigDecimal rating) {
        if (rating == null || rating.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.valueOf(5.0).setScale(1, RoundingMode.HALF_UP);
        }

        return rating.setScale(1, RoundingMode.HALF_UP);
    }

    private Product findVisibleProduct(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        try {
            Long numericId = Long.parseLong(identifier);
            Product product = productRepository.findById(numericId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            if (!product.isVisible()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            return product;
        } catch (NumberFormatException ignored) {
            Product product = productRepository.findBySlugIgnoreCase(identifier)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            if (!product.isVisible()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            return product;
        }
    }
}
