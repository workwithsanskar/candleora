package com.candleora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(32) DEFAULT 'ALL_PRODUCTS'")
    private CouponScope scope = CouponScope.ALL_PRODUCTS;

    @Column(name = "`value`", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscount;

    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean firstOrderOnly = false;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean oneUsePerCustomer = false;

    @Column
    private Instant startsAt;

    @Column
    private Instant endsAt;

    @Column
    private Integer usageLimit;

    @Column(nullable = false)
    private Integer usageCount = 0;

    @Column(length = 1000)
    private String targetCategorySlugs;

    @Column(length = 2000)
    private String targetProductIds;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public CouponType getType() {
        return type;
    }

    public void setType(CouponType type) {
        this.type = type;
    }

    public CouponScope getScope() {
        return scope;
    }

    public void setScope(CouponScope scope) {
        this.scope = scope;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public BigDecimal getMaxDiscount() {
        return maxDiscount;
    }

    public void setMaxDiscount(BigDecimal maxDiscount) {
        this.maxDiscount = maxDiscount;
    }

    public BigDecimal getMinOrderAmount() {
        return minOrderAmount;
    }

    public void setMinOrderAmount(BigDecimal minOrderAmount) {
        this.minOrderAmount = minOrderAmount;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isFirstOrderOnly() {
        return firstOrderOnly;
    }

    public void setFirstOrderOnly(boolean firstOrderOnly) {
        this.firstOrderOnly = firstOrderOnly;
    }

    public boolean isOneUsePerCustomer() {
        return oneUsePerCustomer;
    }

    public void setOneUsePerCustomer(boolean oneUsePerCustomer) {
        this.oneUsePerCustomer = oneUsePerCustomer;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }

    public Integer getUsageLimit() {
        return usageLimit;
    }

    public void setUsageLimit(Integer usageLimit) {
        this.usageLimit = usageLimit;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public String getTargetCategorySlugs() {
        return targetCategorySlugs;
    }

    public void setTargetCategorySlugs(String targetCategorySlugs) {
        this.targetCategorySlugs = targetCategorySlugs;
    }

    public String getTargetProductIds() {
        return targetProductIds;
    }

    public void setTargetProductIds(String targetProductIds) {
        this.targetProductIds = targetProductIds;
    }

    public void incrementUsage() {
        if (usageCount == null) {
            usageCount = 0;
        }
        usageCount += 1;
    }
}
