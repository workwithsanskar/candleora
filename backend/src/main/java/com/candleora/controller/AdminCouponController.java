package com.candleora.controller;

import com.candleora.dto.coupon.AdminCouponRequest;
import com.candleora.dto.coupon.AdminCouponUpdateRequest;
import com.candleora.dto.coupon.CouponAdminResponse;
import com.candleora.service.CouponService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<CouponAdminResponse> listCoupons() {
        return couponService.listCoupons();
    }

    @GetMapping("/{id}")
    public CouponAdminResponse getCoupon(@PathVariable Long id) {
        return couponService.getCoupon(id);
    }

    @PostMapping
    public CouponAdminResponse createCoupon(@Valid @RequestBody AdminCouponRequest request) {
        return couponService.createCoupon(request);
    }

    @PutMapping("/{id}")
    public CouponAdminResponse updateCoupon(
        @PathVariable Long id,
        @RequestBody AdminCouponUpdateRequest request
    ) {
        return couponService.updateCoupon(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
    }
}
