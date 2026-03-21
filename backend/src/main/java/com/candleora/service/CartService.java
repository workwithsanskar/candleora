package com.candleora.service;

import com.candleora.dto.cart.CartItemRequest;
import com.candleora.dto.cart.CartItemResponse;
import com.candleora.dto.cart.CartResponse;
import com.candleora.dto.cart.UpdateCartItemRequest;
import com.candleora.entity.AppUser;
import com.candleora.entity.CartItem;
import com.candleora.entity.Product;
import com.candleora.repository.CartItemRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public CartResponse getCart(AppUser user) {
        return toCartResponse(cartItemRepository.findByUserOrderByIdAsc(user));
    }

    public CartResponse addItem(AppUser user, CartItemRequest request) {
        Product product = findProduct(request.productId());
        CartItem cartItem = cartItemRepository.findByUserAndProduct(user, product).orElseGet(() -> {
            CartItem item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
            item.setQuantity(0);
            return item;
        });

        cartItem.setQuantity(cartItem.getQuantity() + request.quantity());
        cartItemRepository.save(cartItem);
        return getCart(user);
    }

    public CartResponse updateItem(AppUser user, Long itemId, UpdateCartItemRequest request) {
        CartItem cartItem = cartItemRepository.findByIdAndUser(itemId, user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        cartItem.setQuantity(request.quantity());
        cartItemRepository.save(cartItem);
        return getCart(user);
    }

    public CartResponse removeItem(AppUser user, Long itemId) {
        CartItem cartItem = cartItemRepository.findByIdAndUser(itemId, user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        cartItemRepository.delete(cartItem);
        return getCart(user);
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private CartResponse toCartResponse(List<CartItem> items) {
        List<CartItemResponse> responses = items.stream().map(this::toCartItemResponse).toList();
        BigDecimal grandTotal = responses.stream()
            .map(CartItemResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(responses, grandTotal);
    }

    private CartItemResponse toCartItemResponse(CartItem item) {
        BigDecimal unitPrice = item.getProduct().getPrice();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        return new CartItemResponse(
            item.getId(),
            item.getProduct().getId(),
            item.getProduct().getName(),
            item.getProduct().getImageUrls().isEmpty() ? "" : item.getProduct().getImageUrls().get(0),
            unitPrice,
            item.getQuantity(),
            lineTotal
        );
    }
}
