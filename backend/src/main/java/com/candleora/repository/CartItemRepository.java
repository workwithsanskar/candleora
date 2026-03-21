package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.CartItem;
import com.candleora.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserOrderByIdAsc(AppUser user);

    Optional<CartItem> findByUserAndProduct(AppUser user, Product product);

    Optional<CartItem> findByIdAndUser(Long id, AppUser user);

    void deleteByUser(AppUser user);
}
