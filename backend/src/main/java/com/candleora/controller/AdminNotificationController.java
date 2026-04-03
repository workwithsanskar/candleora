package com.candleora.controller;

import com.candleora.dto.admin.AdminNotificationsResponse;
import com.candleora.service.AdminNotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    public AdminNotificationController(AdminNotificationService adminNotificationService) {
        this.adminNotificationService = adminNotificationService;
    }

    @GetMapping
    public AdminNotificationsResponse getNotifications(@RequestParam(defaultValue = "8") int limit) {
        return adminNotificationService.getNotifications(limit);
    }

    @PostMapping("/review-all")
    public AdminNotificationsResponse markAllReviewed(@RequestParam(defaultValue = "8") int limit) {
        return adminNotificationService.markAllReviewed(limit);
    }
}
