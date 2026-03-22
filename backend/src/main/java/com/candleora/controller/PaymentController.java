package com.candleora.controller;

import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.dto.payment.CreateRazorpayOrderResponse;
import com.candleora.dto.payment.VerifyRazorpayPaymentRequest;
import com.candleora.security.UserPrincipal;
import com.candleora.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/razorpay")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/order")
    public CreateRazorpayOrderResponse createOrder(
        Authentication authentication,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        return paymentService.createRazorpayOrder(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            request
        );
    }

    @PostMapping("/verify")
    public OrderResponse verifyPayment(
        Authentication authentication,
        @Valid @RequestBody VerifyRazorpayPaymentRequest request
    ) {
        return paymentService.verifyRazorpayPayment(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            request
        );
    }
}
