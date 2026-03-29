package com.candleora.service;

import com.candleora.dto.catalog.ProductReviewRequest;
import com.candleora.dto.catalog.ProductReviewResponse;
import com.candleora.dto.catalog.ProductReviewSummaryResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.Product;
import com.candleora.entity.ProductReview;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ProductReviewRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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

    @Transactional
    public ProductReviewSummaryResponse getReviews(String identifier, AppUser user) {
        Product product = findVisibleProduct(identifier);
        return buildSummary(product, user);
    }

    @Transactional
    public ProductReviewSummaryResponse createReview(String identifier, ProductReviewRequest request, AppUser user) {
        Product product = findVisibleProduct(identifier);
        String reviewerEmail = currentUserEmail(user);
        Long reviewerUserId = currentUserId(user);

        if (reviewerUserId == null || !StringUtils.hasText(reviewerEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add an email address to your account before reviewing");
        }

        Optional<ProductReview> existingReview = resolveExistingReview(product.getId(), user);
        if (existingReview.isPresent()) {
            attachReviewToUser(existingReview.get(), user);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this product");
        }

        ProductReview review = new ProductReview();
        review.setProduct(product);
        review.setReviewerUser(user);
        review.setReviewerName(resolveReviewerName(user, request));
        review.setReviewerEmail(reviewerEmail);
        review.setRating(request.rating());
        review.setMessage(request.message().trim());
        productReviewRepository.save(review);

        ProductReviewSummaryResponse summary = buildSummary(product, user);
        product.setRating(summary.averageRating());
        productRepository.save(product);

        return summary;
    }

    private ProductReviewSummaryResponse buildSummary(Product product, AppUser user) {
        List<ProductReview> reviews = productReviewRepository.findAllByProductIdOrderByCreatedAtDescIdDesc(product.getId());
        BigDecimal averageRating = reviews.isEmpty()
            ? fallbackRating(product.getRating())
            : calculateAverage(reviews);
        ProductReviewResponse currentUserReview = resolveCurrentUserReview(product.getId(), user);

        return new ProductReviewSummaryResponse(
            averageRating,
            reviews.size(),
            reviews.stream().map(this::toResponse).toList(),
            currentUserReview
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

    private ProductReviewResponse resolveCurrentUserReview(Long productId, AppUser user) {
        Optional<ProductReview> existingReview = resolveExistingReview(productId, user);
        if (existingReview.isEmpty()) {
            return null;
        }

        ProductReview review = existingReview.get();
        attachReviewToUser(review, user);
        return toResponse(review);
    }

    private String resolveReviewerName(AppUser user, ProductReviewRequest request) {
        if (user != null && StringUtils.hasText(user.getName())) {
            return user.getName().trim();
        }

        return request.reviewerName().trim();
    }

    private Optional<ProductReview> resolveExistingReview(Long productId, AppUser user) {
        Long reviewerUserId = currentUserId(user);
        if (reviewerUserId != null) {
            Optional<ProductReview> byUser = productReviewRepository.findByProductIdAndReviewerUserId(
                productId,
                reviewerUserId
            );
            if (byUser.isPresent()) {
                return byUser;
            }
        }

        String reviewerEmail = currentUserEmail(user);
        if (!StringUtils.hasText(reviewerEmail)) {
            return Optional.empty();
        }

        return productReviewRepository.findByProductIdAndReviewerEmailIgnoreCase(productId, reviewerEmail);
    }

    private void attachReviewToUser(ProductReview review, AppUser user) {
        Long reviewerUserId = currentUserId(user);
        if (review == null || reviewerUserId == null) {
            return;
        }

        if (review.getReviewerUser() != null) {
            if (Objects.equals(review.getReviewerUser().getId(), reviewerUserId)) {
                return;
            }

            return;
        }

        review.setReviewerUser(user);
        if (StringUtils.hasText(user.getName())) {
            review.setReviewerName(user.getName().trim());
        }
        if (StringUtils.hasText(currentUserEmail(user))) {
            review.setReviewerEmail(currentUserEmail(user));
        }
        productReviewRepository.save(review);
    }

    private String currentUserEmail(AppUser user) {
        if (user == null || !StringUtils.hasText(user.getEmail())) {
            return null;
        }

        return user.getEmail().trim().toLowerCase(Locale.ROOT);
    }

    private Long currentUserId(AppUser user) {
        return user == null ? null : user.getId();
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
