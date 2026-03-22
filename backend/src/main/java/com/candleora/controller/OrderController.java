package com.candleora.controller;

import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.security.UserPrincipal;
import com.candleora.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse placeOrder(
        Authentication authentication,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        return orderService.placeOrder(((UserPrincipal) authentication.getPrincipal()).getUser(), request);
    }

    @GetMapping
    public List<OrderResponse> getOrderHistory(Authentication authentication) {
        return orderService.getOrders(((UserPrincipal) authentication.getPrincipal()).getUser());
    }

    @GetMapping("/me")
    public List<OrderResponse> getOrders(Authentication authentication) {
        return orderService.getOrders(((UserPrincipal) authentication.getPrincipal()).getUser());
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(Authentication authentication, @org.springframework.web.bind.annotation.PathVariable Long orderId) {
        return orderService.getOrder(((UserPrincipal) authentication.getPrincipal()).getUser(), orderId);
    }
}
