package com.candleora.dto.admin;

import java.util.List;

public record AdminCustomerInsightsResponse(
    long totalCustomers,
    long newCustomers,
    long returningCustomers,
    List<AdminDistributionItemResponse> segments,
    List<AdminTopCustomerResponse> topCustomers
) {
}
