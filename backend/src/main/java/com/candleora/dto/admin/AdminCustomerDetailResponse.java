package com.candleora.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminCustomerDetailResponse(
    Long id,
    String name,
    String email,
    String phoneNumber,
    String alternatePhoneNumber,
    boolean emailVerified,
    boolean phoneVerified,
    String authProvider,
    String gender,
    LocalDate dateOfBirth,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    String locationLabel,
    Double latitude,
    Double longitude,
    Instant createdAt,
    long totalOrders,
    long deliveredOrders,
    long cancelledOrders,
    BigDecimal totalSpent,
    BigDecimal averageOrderValue,
    Instant lastOrderAt,
    List<AdminCustomerAddressResponse> addresses,
    List<AdminCustomerOrderHistoryResponse> orders
) {
}
