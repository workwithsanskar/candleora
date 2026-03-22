package com.candleora.dto.cart;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CartSyncRequest(
    @Valid @NotEmpty List<CartItemRequest> items
) {
}
