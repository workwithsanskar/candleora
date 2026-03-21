package com.candleora.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderRequestItem(
    @NotNull Long productId,
    @NotNull @Min(1) Integer quantity
) {
}
