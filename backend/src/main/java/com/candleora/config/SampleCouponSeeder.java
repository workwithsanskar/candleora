package com.candleora.config;

import com.candleora.entity.Coupon;
import com.candleora.entity.CouponType;
import com.candleora.repository.CouponRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SampleCouponSeeder implements ApplicationRunner {

    private final CouponRepository couponRepository;
    private final boolean seedEnabled;
    private final String code;
    private final CouponType type;
    private final BigDecimal value;
    private final BigDecimal maxDiscount;
    private final BigDecimal minOrderAmount;
    private final Integer usageLimit;

    public SampleCouponSeeder(
        CouponRepository couponRepository,
        @Value("${app.coupons.sample.enabled:false}") boolean seedEnabled,
        @Value("${app.coupons.sample.code:}") String code,
        @Value("${app.coupons.sample.type:PERCENTAGE}") CouponType type,
        @Value("${app.coupons.sample.value:0}") BigDecimal value,
        @Value("${app.coupons.sample.max-discount:0}") BigDecimal maxDiscount,
        @Value("${app.coupons.sample.min-order-amount:0}") BigDecimal minOrderAmount,
        @Value("${app.coupons.sample.usage-limit:0}") Integer usageLimit
    ) {
        this.couponRepository = couponRepository;
        this.seedEnabled = seedEnabled;
        this.code = code;
        this.type = type;
        this.value = value;
        this.maxDiscount = maxDiscount;
        this.minOrderAmount = minOrderAmount;
        this.usageLimit = usageLimit;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedEnabled || !StringUtils.hasText(code) || value == null || value.signum() <= 0) {
            return;
        }

        String normalizedCode = code.trim().toUpperCase(Locale.ENGLISH);
        if (couponRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
            return;
        }

        Coupon coupon = new Coupon();
        coupon.setCode(normalizedCode);
        coupon.setType(type == null ? CouponType.PERCENTAGE : type);
        coupon.setValue(value);
        coupon.setMaxDiscount(maxDiscount != null && maxDiscount.signum() > 0 ? maxDiscount : null);
        coupon.setMinOrderAmount(minOrderAmount != null && minOrderAmount.signum() > 0 ? minOrderAmount : null);
        coupon.setUsageLimit(usageLimit != null && usageLimit > 0 ? usageLimit : null);
        coupon.setUsageCount(0);
        coupon.setActive(true);
        coupon.setStartsAt(Instant.now().minus(1, ChronoUnit.HOURS));
        coupon.setEndsAt(Instant.now().plus(365, ChronoUnit.DAYS));

        couponRepository.save(coupon);
    }
}
