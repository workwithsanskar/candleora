package com.candleora.repository;

import com.candleora.entity.ProductReview;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findAllByProductIdOrderByCreatedAtDescIdDesc(Long productId);

    Optional<ProductReview> findByProductIdAndReviewerUserId(Long productId, Long reviewerUserId);

    Optional<ProductReview> findByProductIdAndReviewerEmailIgnoreCase(Long productId, String reviewerEmail);
}
