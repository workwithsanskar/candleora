package com.candleora.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record PlaceOrderRequest(
    @NotBlank String shippingName,
    @NotBlank String phone,
    @Email String contactEmail,
    String alternatePhoneNumber,
    @NotBlank String addressLine1,
    String addressLine2,
    @NotBlank String city,
    @NotBlank String state,
    @NotBlank String postalCode,
    String locationLabel,
    Double latitude,
    Double longitude,
    @NotBlank String paymentMethod,
    @Valid List<OrderRequestItem> items
) {
}
