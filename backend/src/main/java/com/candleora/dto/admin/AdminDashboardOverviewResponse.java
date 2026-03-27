package com.candleora.dto.admin;

import java.util.List;

public record AdminDashboardOverviewResponse(
    AdminRevenueMetricsResponse metrics,
    List<AdminTrendPointResponse> salesTrend,
    List<AdminTopProductResponse> topProducts,
    List<AdminDistributionItemResponse> revenueDistribution,
    List<AdminDistributionItemResponse> customerSegments
) {
}
