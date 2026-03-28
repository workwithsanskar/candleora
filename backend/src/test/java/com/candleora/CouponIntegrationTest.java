package com.candleora;

import com.candleora.entity.Coupon;
import com.candleora.entity.CouponType;
import com.candleora.repository.CouponRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

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
}
