package com.candleora.service;

import com.candleora.dto.coupon.AdminCouponRequest;
import com.candleora.dto.coupon.AdminCouponUpdateRequest;
import com.candleora.dto.coupon.CouponAdminResponse;
import com.candleora.dto.coupon.CouponQuoteResponse;
import com.candleora.dto.order.OrderRequestItem;
import com.candleora.entity.Coupon;
import com.candleora.entity.CouponType;
import com.candleora.entity.Product;
import com.candleora.repository.CouponRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Comparator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CouponService {

    private final CouponRepository couponRepository;
    private final ProductRepository productRepository;

    public CouponService(CouponRepository couponRepository, ProductRepository productRepository) {
        this.couponRepository = couponRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public CouponQuoteResponse validateCoupon(String code, List<OrderRequestItem> items) {
        CouponQuote quote = quoteCoupon(code, items);
        return new CouponQuoteResponse(
            quote.code(),
            quote.subtotalAmount(),
            quote.discountAmount(),
            quote.totalAmount(),
            quote.message()
        );
    }

    @Transactional(readOnly = true)
    public List<CouponAdminResponse> listCoupons() {
        return couponRepository.findAll().stream()
            .sorted(Comparator.comparing(Coupon::getCode, String.CASE_INSENSITIVE_ORDER))
            .map(this::toAdminResponse)
            .toList();
    }

    public CouponAdminResponse createCoupon(AdminCouponRequest request) {
        String code = normalizeCode(request.code());
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Coupon code already exists");
        }

        validateAdminCouponPayload(
            Objects.requireNonNull(request.type()),
            request.value(),
            request.maxDiscount(),
            request.minOrderAmount(),
            request.startsAt(),
            request.endsAt(),
            request.usageLimit()
        );

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setType(Objects.requireNonNull(request.type()));
        coupon.setValue(request.value());
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setMinOrderAmount(request.minOrderAmount());
        coupon.setActive(request.active());
        coupon.setStartsAt(request.startsAt());
        coupon.setEndsAt(request.endsAt());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setUsageCount(0);
        return toAdminResponse(couponRepository.save(coupon));
    }

    public CouponAdminResponse updateCoupon(Long id, AdminCouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

        if (StringUtils.hasText(request.code())) {
            String code = normalizeCode(request.code());
            couponRepository.findByCodeIgnoreCase(code)
                .filter(existing -> !existing.getId().equals(coupon.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Coupon code already exists");
                });
            coupon.setCode(code);
        }

        CouponType nextType = request.type() != null ? request.type() : coupon.getType();
        BigDecimal nextValue = request.value() != null ? request.value() : coupon.getValue();
        BigDecimal nextMaxDiscount = request.maxDiscount();
        BigDecimal nextMinOrderAmount = request.minOrderAmount();
        Instant nextStartsAt = request.startsAt();
        Instant nextEndsAt = request.endsAt();
        Integer nextUsageLimit = request.usageLimit();

        validateAdminCouponPayload(
            nextType,
            nextValue,
            nextMaxDiscount,
            nextMinOrderAmount,
            nextStartsAt,
            nextEndsAt,
            nextUsageLimit
        );

        coupon.setType(nextType);
        coupon.setValue(nextValue);
        coupon.setMaxDiscount(nextMaxDiscount);
        coupon.setMinOrderAmount(nextMinOrderAmount);

        if (request.active() != null) {
            coupon.setActive(request.active());
        }

        coupon.setStartsAt(nextStartsAt);
        coupon.setEndsAt(nextEndsAt);
        coupon.setUsageLimit(nextUsageLimit);

        return toAdminResponse(couponRepository.save(coupon));
    }

    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));
        couponRepository.delete(coupon);
    }

    public CouponQuote quoteCoupon(String code, List<OrderRequestItem> items) {
        if (!StringUtils.hasText(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a coupon code");
        }

        BigDecimal subtotal = calculateSubtotal(items);
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

        validateCoupon(coupon, subtotal);

        BigDecimal discount = calculateDiscount(coupon, subtotal);
        BigDecimal total = subtotal.subtract(discount).max(BigDecimal.ZERO);

        return new CouponQuote(
            coupon.getCode().toUpperCase(Locale.ENGLISH),
            subtotal,
            discount,
            total,
            "Coupon applied"
        );
    }

    public void incrementUsage(String code) {
        if (!StringUtils.hasText(code)) {
            return;
        }

        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

        coupon.incrementUsage();
        couponRepository.save(coupon);
    }

    private void validateCoupon(Coupon coupon, BigDecimal subtotal) {
        if (!coupon.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon is not active");
        }

        Instant now = Instant.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon is not active yet");
        }

        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon has expired");
        }

        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Order total must be at least Rs. " + coupon.getMinOrderAmount().setScale(0, RoundingMode.HALF_UP)
            );
        }

        if (coupon.getUsageLimit() != null) {
            int used = coupon.getUsageCount() == null ? 0 : coupon.getUsageCount();
            if (used >= coupon.getUsageLimit()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon has reached its limit");
            }
        }
    }

    private BigDecimal calculateSubtotal(List<OrderRequestItem> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderRequestItem item : items) {
            Product product = productRepository.findById(item.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            BigDecimal lineTotal = product.getPrice()
                .multiply(BigDecimal.valueOf(item.quantity()));
            subtotal = subtotal.add(lineTotal);
        }
        return subtotal;
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            BigDecimal percent = coupon.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            discount = subtotal.multiply(percent);
        } else {
            discount = coupon.getValue();
        }

        if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    private void validateAdminCouponPayload(
        CouponType type,
        BigDecimal value,
        BigDecimal maxDiscount,
        BigDecimal minOrderAmount,
        Instant startsAt,
        Instant endsAt,
        Integer usageLimit
    ) {
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon type is required");
        }

        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon value must be positive");
        }

        if (type == CouponType.PERCENTAGE && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Percentage coupons cannot exceed 100%");
        }

        if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum discount must be positive");
        }

        if (minOrderAmount != null && minOrderAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum order amount cannot be negative");
        }

        if (usageLimit != null && usageLimit <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usage limit must be greater than zero");
        }

        if (startsAt != null && endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon end time must be after the start time");
        }
    }

    private CouponAdminResponse toAdminResponse(Coupon coupon) {
        return new CouponAdminResponse(
            coupon.getId(),
            coupon.getCode(),
            coupon.getType(),
            coupon.getValue(),
            coupon.getMaxDiscount(),
            coupon.getMinOrderAmount(),
            coupon.isActive(),
            coupon.getStartsAt(),
            coupon.getEndsAt(),
            coupon.getUsageLimit(),
            coupon.getUsageCount()
        );
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ENGLISH);
    }

    public record CouponQuote(
        String code,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String message
    ) {
    }
}
