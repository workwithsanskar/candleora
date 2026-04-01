package com.candleora;

import com.candleora.entity.Coupon;
import com.candleora.entity.CouponType;
import com.candleora.repository.CouponRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CouponIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private CouponRepository couponRepository;

    @Test
    void guestCheckoutCanValidateCoupon() throws Exception {
        Coupon coupon = new Coupon();
        coupon.setCode("WELCOME10");
        coupon.setType(CouponType.PERCENTAGE);
        coupon.setValue(BigDecimal.TEN);
        coupon.setActive(true);
        coupon.setUsageCount(0);
        couponRepository.save(coupon);

        mockMvc.perform(
                MockMvcRequestBuilders.post("/api/coupons/validate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of(
                        "code", "WELCOME10",
                        "items", List.of(Map.of(
                            "productId", 4,
                            "quantity", 1
                        ))
                    )))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("WELCOME10"))
            .andExpect(jsonPath("$.message").value("Coupon applied"))
            .andExpect(jsonPath("$.subtotalAmount").value(1299.00))
            .andExpect(jsonPath("$.discountAmount").value(129.90))
            .andExpect(jsonPath("$.totalAmount").value(1169.10));
    }

    @Test
    void offersEndpointReturnsOnlyActiveVisibleCoupons() throws Exception {
        Coupon activeCoupon = new Coupon();
        activeCoupon.setCode("AURA15");
        activeCoupon.setType(CouponType.PERCENTAGE);
        activeCoupon.setValue(BigDecimal.valueOf(15));
        activeCoupon.setActive(true);
        activeCoupon.setUsageCount(0);
        activeCoupon.setEndsAt(Instant.now().plusSeconds(7200));
        couponRepository.save(activeCoupon);

        Coupon expiredCoupon = new Coupon();
        expiredCoupon.setCode("OLD10");
        expiredCoupon.setType(CouponType.PERCENTAGE);
        expiredCoupon.setValue(BigDecimal.TEN);
        expiredCoupon.setActive(true);
        expiredCoupon.setUsageCount(0);
        expiredCoupon.setEndsAt(Instant.now().minusSeconds(7200));
        couponRepository.save(expiredCoupon);

        mockMvc.perform(MockMvcRequestBuilders.get("/api/coupons/offers"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].code", hasItem("AURA15")))
            .andExpect(jsonPath("$[*].code", not(hasItem("OLD10"))))
            .andExpect(jsonPath("$[0].title").isNotEmpty())
            .andExpect(jsonPath("$[0].expiryText").isNotEmpty());
    }
}
