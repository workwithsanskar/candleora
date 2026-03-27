package com.candleora.dto.admin;

import java.util.List;

public record AdminSalesInsightsResponse(
    List<AdminTrendPointResponse> trend,
    List<AdminTopProductResponse> topProducts,
    List<AdminDistributionItemResponse> revenueDistribution
) {
}
