package com.candleora.dto.chat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record AuraOrderSummaryResponse(
    Long id,
    String status,
    String paymentStatus,
    BigDecimal totalAmount,
    String shippingName,
    String contactEmail,
    LocalDate estimatedDeliveryStart,
    LocalDate estimatedDeliveryEnd,
    String reference,
    String invoiceNumber,
    boolean canViewDetails,
    boolean canDownloadInvoice,
    Integer itemCount,
    List<AuraOrderItemSummaryResponse> items
) {
}
