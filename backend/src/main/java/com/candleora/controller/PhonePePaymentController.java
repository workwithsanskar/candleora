package com.candleora.controller;

import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.dto.payment.CreatePhonePePaymentResponse;
import com.candleora.security.UserPrincipal;
import com.candleora.service.PhonePePaymentService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/phonepe")
public class PhonePePaymentController {

    private final PhonePePaymentService phonePePaymentService;

    public PhonePePaymentController(PhonePePaymentService phonePePaymentService) {
        this.phonePePaymentService = phonePePaymentService;
    }

    @PostMapping("/order")
    public CreatePhonePePaymentResponse createOrder(
        Authentication authentication,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        return phonePePaymentService.createCheckoutSession(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            request
        );
    }

    @GetMapping("/status/{orderId}")
    public OrderResponse getStatus(Authentication authentication, @PathVariable Long orderId) {
        return phonePePaymentService.fetchPaymentStatus(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            orderId
        );
    }

    @PostMapping("/callback")
    public Map<String, Object> callback() {
        return Map.of("success", true);
    }
}
