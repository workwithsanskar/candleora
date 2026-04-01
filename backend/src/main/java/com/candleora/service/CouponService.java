package com.candleora.service;

import com.candleora.dto.coupon.AdminCouponRequest;
import com.candleora.dto.coupon.AdminCouponUpdateRequest;
import com.candleora.dto.coupon.CouponAdminResponse;
import com.candleora.dto.coupon.CouponOfferResponse;
import com.candleora.dto.coupon.CouponQuoteResponse;
import com.candleora.dto.order.OrderRequestItem;
import com.candleora.entity.AppUser;
import com.candleora.entity.Category;
import com.candleora.entity.Coupon;
import com.candleora.entity.CouponScope;
import com.candleora.entity.CouponType;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.PaymentStatus;
import com.candleora.entity.Product;
import com.candleora.repository.CategoryRepository;
import com.candleora.repository.CouponRepository;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.Comparator;
import java.util.stream.Collectors;
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
    private final CategoryRepository categoryRepository;
    private final CustomerOrderRepository customerOrderRepository;

    public CouponService(
        CouponRepository couponRepository,
        ProductRepository productRepository,
        CategoryRepository categoryRepository,
        CustomerOrderRepository customerOrderRepository
    ) {
        this.couponRepository = couponRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.customerOrderRepository = customerOrderRepository;
    }

    @Transactional(readOnly = true)
    public CouponQuoteResponse validateCoupon(String code, List<OrderRequestItem> items) {
        return validateCoupon(null, code, items);
    }

    @Transactional(readOnly = true)
    public CouponQuoteResponse validateCoupon(AppUser user, String code, List<OrderRequestItem> items) {
        CouponQuote quote = quoteCoupon(user, code, items);
        return new CouponQuoteResponse(
            quote.code(),
            quote.subtotalAmount(),
            quote.discountAmount(),
            quote.totalAmount(),
            quote.message()
        );
    }

    @Transactional(readOnly = true)
    public List<CouponOfferResponse> listVisibleOffers(AppUser user) {
        return couponRepository.findAll().stream()
            .filter(this::isOfferCurrentlyVisible)
            .filter(coupon -> canShowOfferToUser(coupon, user))
            .sorted(Comparator.comparing(Coupon::getEndsAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(this::toOfferResponse)
            .toList();
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

        List<String> categorySlugs = normalizeCategorySlugs(request.categorySlugs());
        List<Long> productIds = normalizeProductIds(request.productIds());

        validateAdminCouponPayload(
            Objects.requireNonNull(request.type()),
            Objects.requireNonNull(request.scope()),
            request.value(),
            request.maxDiscount(),
            request.minOrderAmount(),
            request.startsAt(),
            request.endsAt(),
            request.usageLimit(),
            categorySlugs,
            productIds
        );

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setType(Objects.requireNonNull(request.type()));
        coupon.setScope(Objects.requireNonNull(request.scope()));
        coupon.setValue(request.value());
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setMinOrderAmount(request.minOrderAmount());
        coupon.setActive(request.active());
        coupon.setFirstOrderOnly(request.firstOrderOnly());
        coupon.setOneUsePerCustomer(request.oneUsePerCustomer());
        coupon.setStartsAt(request.startsAt());
        coupon.setEndsAt(request.endsAt());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setUsageCount(0);
        coupon.setTargetCategorySlugs(serializeCategorySlugs(categorySlugs));
        coupon.setTargetProductIds(serializeProductIds(productIds));
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
        CouponScope nextScope = request.scope() != null ? request.scope() : coupon.getScope();
        BigDecimal nextValue = request.value() != null ? request.value() : coupon.getValue();
        BigDecimal nextMaxDiscount = request.maxDiscount();
        BigDecimal nextMinOrderAmount = request.minOrderAmount();
        Instant nextStartsAt = request.startsAt();
        Instant nextEndsAt = request.endsAt();
        Integer nextUsageLimit = request.usageLimit();
        boolean nextFirstOrderOnly = request.firstOrderOnly() != null
            ? request.firstOrderOnly()
            : coupon.isFirstOrderOnly();
        boolean nextOneUsePerCustomer = request.oneUsePerCustomer() != null
            ? request.oneUsePerCustomer()
            : coupon.isOneUsePerCustomer();
        List<String> nextCategorySlugs = normalizeCategorySlugs(request.categorySlugs());
        List<Long> nextProductIds = normalizeProductIds(request.productIds());

        validateAdminCouponPayload(
            nextType,
            nextScope,
            nextValue,
            nextMaxDiscount,
            nextMinOrderAmount,
            nextStartsAt,
            nextEndsAt,
            nextUsageLimit,
            nextCategorySlugs,
            nextProductIds
        );

        coupon.setType(nextType);
        coupon.setScope(nextScope);
        coupon.setValue(nextValue);
        coupon.setMaxDiscount(nextMaxDiscount);
        coupon.setMinOrderAmount(nextMinOrderAmount);

        if (request.active() != null) {
            coupon.setActive(request.active());
        }

        coupon.setFirstOrderOnly(nextFirstOrderOnly);
        coupon.setOneUsePerCustomer(nextOneUsePerCustomer);
        coupon.setStartsAt(nextStartsAt);
        coupon.setEndsAt(nextEndsAt);
        coupon.setUsageLimit(nextUsageLimit);
        coupon.setTargetCategorySlugs(serializeCategorySlugs(nextCategorySlugs));
        coupon.setTargetProductIds(serializeProductIds(nextProductIds));

        return toAdminResponse(couponRepository.save(coupon));
    }

    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));
        couponRepository.delete(coupon);
    }

    public CouponQuote quoteCoupon(String code, List<OrderRequestItem> items) {
        return quoteCoupon(null, code, items);
    }

    public CouponQuote quoteCoupon(AppUser user, String code, List<OrderRequestItem> items) {
        if (!StringUtils.hasText(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a coupon code");
        }

        List<ResolvedOrderLine> orderLines = resolveOrderLines(items);
        BigDecimal subtotal = calculateSubtotal(orderLines);
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

        validateCustomerRestrictions(coupon, user);

        BigDecimal eligibleSubtotal = calculateEligibleSubtotal(coupon, orderLines);
        validateCoupon(coupon, subtotal, eligibleSubtotal);

        BigDecimal discount = calculateDiscount(coupon, eligibleSubtotal);
        BigDecimal total = subtotal.subtract(discount).max(BigDecimal.ZERO);
        String message = eligibleSubtotal.compareTo(subtotal) < 0
            ? "Coupon applied to eligible items"
            : "Coupon applied";

        return new CouponQuote(
            coupon.getCode().toUpperCase(Locale.ENGLISH),
            subtotal,
            discount,
            total,
            message
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

    private void validateCustomerRestrictions(Coupon coupon, AppUser user) {
        if ((coupon.isFirstOrderOnly() || coupon.isOneUsePerCustomer()) && user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sign in to use this coupon");
        }

        if (user == null) {
            return;
        }

        if (coupon.isFirstOrderOnly()) {
            long orderCount = customerOrderRepository.countByUserAndStatusNotAndPaymentStatusNot(
                user,
                OrderStatus.CANCELLED,
                PaymentStatus.FAILED
            );
            if (orderCount > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon is only for a first order");
            }
        }

        if (coupon.isOneUsePerCustomer()) {
            boolean alreadyUsed = customerOrderRepository.existsByUserAndCouponCodeIgnoreCaseAndStatusNotAndPaymentStatusNot(
                user,
                coupon.getCode(),
                OrderStatus.CANCELLED,
                PaymentStatus.FAILED
            );
            if (alreadyUsed) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already used this coupon");
            }
        }
    }

    private void validateCoupon(Coupon coupon, BigDecimal subtotal, BigDecimal eligibleSubtotal) {
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

        if (eligibleSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This coupon does not apply to items in your cart");
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

    private List<ResolvedOrderLine> resolveOrderLines(List<OrderRequestItem> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        return items.stream()
            .map(item -> {
                Product product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
                BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.quantity()));
                return new ResolvedOrderLine(product, item.quantity(), lineTotal);
            })
            .toList();
    }

    private BigDecimal calculateSubtotal(List<ResolvedOrderLine> orderLines) {
        return orderLines.stream()
            .map(ResolvedOrderLine::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateEligibleSubtotal(Coupon coupon, List<ResolvedOrderLine> orderLines) {
        return switch (coupon.getScope()) {
            case ALL_PRODUCTS -> calculateSubtotal(orderLines);
            case CATEGORIES -> {
                Set<String> categorySlugs = parseCategorySlugs(coupon.getTargetCategorySlugs());
                BigDecimal total = orderLines.stream()
                    .filter(line -> categorySlugs.contains(line.product().getCategory().getSlug().toLowerCase(Locale.ROOT)))
                    .map(ResolvedOrderLine::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                yield total;
            }
            case PRODUCTS -> {
                Set<Long> productIds = parseProductIds(coupon.getTargetProductIds());
                BigDecimal total = orderLines.stream()
                    .filter(line -> productIds.contains(line.product().getId()))
                    .map(ResolvedOrderLine::lineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                yield total;
            }
        };
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal eligibleSubtotal) {
        BigDecimal discount;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            BigDecimal percent = coupon.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            discount = eligibleSubtotal.multiply(percent);
        } else {
            discount = coupon.getValue();
        }

        if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }

        if (discount.compareTo(eligibleSubtotal) > 0) {
            discount = eligibleSubtotal;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    private void validateAdminCouponPayload(
        CouponType type,
        CouponScope scope,
        BigDecimal value,
        BigDecimal maxDiscount,
        BigDecimal minOrderAmount,
        Instant startsAt,
        Instant endsAt,
        Integer usageLimit,
        List<String> categorySlugs,
        List<Long> productIds
    ) {
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon type is required");
        }

        if (scope == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon scope is required");
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

        if (scope == CouponScope.CATEGORIES) {
            if (categorySlugs.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one category for this coupon");
            }
            for (String slug : categorySlugs) {
                categoryRepository.findBySlugIgnoreCase(slug)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found: " + slug));
            }
        }

        if (scope == CouponScope.PRODUCTS) {
            if (productIds.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one product for this coupon");
            }
            for (Long productId : productIds) {
                productRepository.findById(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product not found: " + productId));
            }
        }
    }

    private CouponAdminResponse toAdminResponse(Coupon coupon) {
        return new CouponAdminResponse(
            coupon.getId(),
            coupon.getCode(),
            coupon.getType(),
            coupon.getScope(),
            coupon.getValue(),
            coupon.getMaxDiscount(),
            coupon.getMinOrderAmount(),
            coupon.isActive(),
            coupon.isFirstOrderOnly(),
            coupon.isOneUsePerCustomer(),
            coupon.getStartsAt(),
            coupon.getEndsAt(),
            coupon.getUsageLimit(),
            coupon.getUsageCount(),
            parseCategorySlugsAsList(coupon.getTargetCategorySlugs()),
            parseProductIdsAsList(coupon.getTargetProductIds())
        );
    }

    private CouponOfferResponse toOfferResponse(Coupon coupon) {
        return new CouponOfferResponse(
            coupon.getCode(),
            buildOfferTitle(coupon),
            buildOfferDescription(coupon),
            buildOfferEligibilityHint(coupon),
            coupon.getEndsAt(),
            buildOfferExpiryText(coupon)
        );
    }

    private boolean isOfferCurrentlyVisible(Coupon coupon) {
        if (!coupon.isActive()) {
          return false;
        }

        Instant now = Instant.now();
        if (coupon.getStartsAt() != null && now.isBefore(coupon.getStartsAt())) {
            return false;
        }

        if (coupon.getEndsAt() != null && now.isAfter(coupon.getEndsAt())) {
            return false;
        }

        if (coupon.getUsageLimit() != null) {
            int used = coupon.getUsageCount() == null ? 0 : coupon.getUsageCount();
            if (used >= coupon.getUsageLimit()) {
                return false;
            }
        }

        return true;
    }

    private boolean canShowOfferToUser(Coupon coupon, AppUser user) {
        if (user == null) {
            return true;
        }

        if (coupon.isFirstOrderOnly()) {
            long orderCount = customerOrderRepository.countByUserAndStatusNotAndPaymentStatusNot(
                user,
                OrderStatus.CANCELLED,
                PaymentStatus.FAILED
            );
            if (orderCount > 0) {
                return false;
            }
        }

        if (coupon.isOneUsePerCustomer()) {
            return !customerOrderRepository.existsByUserAndCouponCodeIgnoreCaseAndStatusNotAndPaymentStatusNot(
                user,
                coupon.getCode(),
                OrderStatus.CANCELLED,
                PaymentStatus.FAILED
            );
        }

        return true;
    }

    private String buildOfferTitle(Coupon coupon) {
        if (coupon.getType() == CouponType.PERCENTAGE) {
            return "Save " + coupon.getValue().stripTrailingZeros().toPlainString() + "% instantly";
        }

        return "Save Rs. " + coupon.getValue().stripTrailingZeros().toPlainString() + " on your order";
    }

    private String buildOfferDescription(Coupon coupon) {
        return switch (coupon.getScope()) {
            case ALL_PRODUCTS -> "Valid across the CandleOra collection.";
            case CATEGORIES -> "Valid on selected CandleOra categories.";
            case PRODUCTS -> "Valid on selected CandleOra products.";
        };
    }

    private String buildOfferEligibilityHint(Coupon coupon) {
        List<String> hints = new ArrayList<>();

        if (coupon.getMinOrderAmount() != null) {
            hints.add("Min order Rs. " + coupon.getMinOrderAmount().stripTrailingZeros().toPlainString());
        }
        if (coupon.isFirstOrderOnly()) {
            hints.add("First order only");
        }
        if (coupon.isOneUsePerCustomer()) {
            hints.add("One use per customer");
        }

        return hints.isEmpty() ? "Apply during cart or checkout." : String.join(" | ", hints);
    }

    private String buildOfferExpiryText(Coupon coupon) {
        if (coupon.getEndsAt() == null) {
            return "Limited-time offer";
        }

        return "Ends soon";
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ENGLISH);
    }

    private List<String> normalizeCategorySlugs(List<String> categorySlugs) {
        if (categorySlugs == null) {
            return List.of();
        }

        return categorySlugs.stream()
            .filter(StringUtils::hasText)
            .map(value -> value.trim().toLowerCase(Locale.ROOT))
            .distinct()
            .toList();
    }

    private List<Long> normalizeProductIds(List<Long> productIds) {
        if (productIds == null) {
            return List.of();
        }

        return productIds.stream()
            .filter(Objects::nonNull)
            .filter(value -> value > 0)
            .distinct()
            .toList();
    }

    private String serializeCategorySlugs(List<String> categorySlugs) {
        if (categorySlugs == null || categorySlugs.isEmpty()) {
            return null;
        }

        return String.join(",", categorySlugs);
    }

    private String serializeProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return null;
        }

        return productIds.stream()
            .map(String::valueOf)
            .collect(Collectors.joining(","));
    }

    private Set<String> parseCategorySlugs(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }

        return raw.lines()
            .flatMap(line -> List.of(line.split(",")).stream())
            .map(String::trim)
            .filter(StringUtils::hasText)
            .map(value -> value.toLowerCase(Locale.ROOT))
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<String> parseCategorySlugsAsList(String raw) {
        return parseCategorySlugs(raw).stream().toList();
    }

    private Set<Long> parseProductIds(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }

        return raw.lines()
            .flatMap(line -> List.of(line.split(",")).stream())
            .map(String::trim)
            .filter(StringUtils::hasText)
            .map(Long::valueOf)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<Long> parseProductIdsAsList(String raw) {
        return parseProductIds(raw).stream().toList();
    }

    public record CouponQuote(
        String code,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String message
    ) {
    }

    private record ResolvedOrderLine(
        Product product,
        Integer quantity,
        BigDecimal lineTotal
    ) {
    }
}
