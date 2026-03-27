package com.candleora.controller;

import com.candleora.dto.admin.AdminCustomerInsightsResponse;
import com.candleora.dto.admin.AdminDashboardOverviewResponse;
import com.candleora.dto.admin.AdminRevenueMetricsResponse;
import com.candleora.dto.admin.AdminSalesInsightsResponse;
import com.candleora.dto.admin.AdminTrendPointResponse;
import com.candleora.service.AdminAnalyticsService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    public AdminAnalyticsController(AdminAnalyticsService adminAnalyticsService) {
        this.adminAnalyticsService = adminAnalyticsService;
    }

    @GetMapping("/overview")
    public AdminDashboardOverviewResponse getOverview(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return adminAnalyticsService.getDashboardOverview(startDate, endDate);
    }

    @GetMapping("/revenue")
    public AdminRevenueMetricsResponse getRevenue(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return adminAnalyticsService.getRevenueMetrics(startDate, endDate);
    }

    @GetMapping("/sales")
    public AdminSalesInsightsResponse getSales(
        @RequestParam(required = false) String period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return adminAnalyticsService.getSalesInsights(period, startDate, endDate);
    }

    @GetMapping("/customers")
    public AdminCustomerInsightsResponse getCustomers(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return adminAnalyticsService.getCustomerInsights(startDate, endDate);
    }

    @GetMapping("/forecast")
    public List<AdminTrendPointResponse> getForecast(@RequestParam(defaultValue = "7") int days) {
        return adminAnalyticsService.getForecast(days);
    }
}
