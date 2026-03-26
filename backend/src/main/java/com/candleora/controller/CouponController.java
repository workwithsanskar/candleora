package com.candleora.controller;

import com.candleora.dto.coupon.CouponQuoteResponse;
import com.candleora.dto.coupon.ValidateCouponRequest;
import com.candleora.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public CouponQuoteResponse validateCoupon(
        Authentication authentication,
        @Valid @RequestBody ValidateCouponRequest request
    ) {
        return couponService.validateCoupon(request.code(), request.items());
    }
}
