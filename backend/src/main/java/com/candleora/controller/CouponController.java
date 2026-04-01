package com.candleora.controller;

import com.candleora.dto.coupon.CouponOfferResponse;
import com.candleora.dto.coupon.CouponQuoteResponse;
import com.candleora.dto.coupon.ValidateCouponRequest;
import com.candleora.security.UserPrincipal;
import com.candleora.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
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

    @GetMapping("/offers")
    public List<CouponOfferResponse> listOffers(Authentication authentication) {
        UserPrincipal principal = authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal
            ? userPrincipal
            : null;

        return couponService.listVisibleOffers(principal != null ? principal.getUser() : null);
    }

    @PostMapping("/validate")
    public CouponQuoteResponse validateCoupon(
        Authentication authentication,
        @Valid @RequestBody ValidateCouponRequest request
    ) {
        UserPrincipal principal = authentication != null && authentication.getPrincipal() instanceof UserPrincipal userPrincipal
            ? userPrincipal
            : null;

        return couponService.validateCoupon(
            principal != null ? principal.getUser() : null,
            request.code(),
            request.items()
        );
    }
}
