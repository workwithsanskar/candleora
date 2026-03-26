package com.candleora.dto.coupon;

import com.candleora.dto.order.OrderRequestItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ValidateCouponRequest(
    @NotBlank String code,
    @Valid List<OrderRequestItem> items
) {
}
