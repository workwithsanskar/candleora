package com.candleora.dto.admin;

import java.math.BigDecimal;

public record AdminRevenueMetricsResponse(
    BigDecimal totalRevenue,
    long totalOrders,
    long totalCustomers,
    BigDecimal averageOrderValue,
    BigDecimal totalProfit,
    BigDecimal profitMargin,
    BigDecimal conversionRate,
    BigDecimal revenueGrowth
) {
}
