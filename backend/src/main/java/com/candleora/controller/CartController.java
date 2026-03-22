package com.candleora.controller;

import com.candleora.dto.cart.CartItemRequest;
import com.candleora.dto.cart.CartResponse;
import com.candleora.dto.cart.CartSyncRequest;
import com.candleora.dto.cart.UpdateCartItemRequest;
import com.candleora.security.UserPrincipal;
import com.candleora.service.CartService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartResponse getCart(Authentication authentication) {
        return cartService.getCart(((UserPrincipal) authentication.getPrincipal()).getUser());
    }

    @PostMapping("/items")
    public CartResponse addItem(
        Authentication authentication,
        @Valid @RequestBody CartItemRequest request
    ) {
        return cartService.addItem(((UserPrincipal) authentication.getPrincipal()).getUser(), request);
    }

    @PostMapping("/sync")
    public CartResponse syncCart(
        Authentication authentication,
        @Valid @RequestBody CartSyncRequest request
    ) {
        return cartService.syncCart(((UserPrincipal) authentication.getPrincipal()).getUser(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse updateItem(
        Authentication authentication,
        @PathVariable Long itemId,
        @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateItem(((UserPrincipal) authentication.getPrincipal()).getUser(), itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse removeItem(Authentication authentication, @PathVariable Long itemId) {
        return cartService.removeItem(((UserPrincipal) authentication.getPrincipal()).getUser(), itemId);
    }
}
