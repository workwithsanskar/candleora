package com.candleora.repository;

import com.candleora.entity.ProductInventoryMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductInventoryMovementRepository extends JpaRepository<ProductInventoryMovement, Long> {

    List<ProductInventoryMovement> findTop25ByProductIdOrderByCreatedAtDescIdDesc(Long productId);
}
