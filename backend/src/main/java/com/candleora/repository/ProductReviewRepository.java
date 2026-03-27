package com.candleora.repository;

import com.candleora.entity.ProductReview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    List<ProductReview> findAllByProductIdOrderByCreatedAtDescIdDesc(Long productId);
}
