package com.candleora.repository;

import com.candleora.entity.Category;
import com.candleora.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCase(String slug);

    List<Product> findTop4ByCategoryAndVisibleTrueAndIdNotOrderByCreatedAtDesc(Category category, Long id);
}
