package com.candleora.controller;

import com.candleora.dto.admin.AuraAdminOverviewResponse;
import com.candleora.dto.admin.AuraAdminTrainingQueueItemResponse;
import com.candleora.dto.admin.AuraAdminTrainingUpdateRequest;
import com.candleora.entity.AuraTrainingStatus;
import com.candleora.service.AuraAnalyticsService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics/aura")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuraAnalyticsController {

    private final AuraAnalyticsService auraAnalyticsService;

    public AdminAuraAnalyticsController(AuraAnalyticsService auraAnalyticsService) {
        this.auraAnalyticsService = auraAnalyticsService;
    }

    @GetMapping("/overview")
    public AuraAdminOverviewResponse getOverview(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return auraAnalyticsService.getOverview(startDate, endDate);
    }

    @GetMapping("/training")
    public List<AuraAdminTrainingQueueItemResponse> getTrainingQueue(
        @RequestParam(required = false) AuraTrainingStatus status,
        @RequestParam(defaultValue = "8") int limit
    ) {
        return auraAnalyticsService.getTrainingQueue(status, limit);
    }

    @PutMapping("/training/{id}")
    public AuraAdminTrainingQueueItemResponse updateTrainingItem(
        @PathVariable Long id,
        @Valid @RequestBody AuraAdminTrainingUpdateRequest request
    ) {
        return auraAnalyticsService.updateTrainingItem(id, request);
    }
}
