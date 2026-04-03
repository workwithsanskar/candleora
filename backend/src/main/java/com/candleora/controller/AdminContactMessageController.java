package com.candleora.controller;

import com.candleora.dto.admin.AdminContactMessageResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.service.AdminContactMessageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/contact-messages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContactMessageController {

    private final AdminContactMessageService adminContactMessageService;

    public AdminContactMessageController(AdminContactMessageService adminContactMessageService) {
        this.adminContactMessageService = adminContactMessageService;
    }

    @GetMapping
    public PagedResponse<AdminContactMessageResponse> getContactMessages(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Boolean reviewed,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return adminContactMessageService.getContactMessages(search, reviewed, page, size);
    }

    @GetMapping("/{messageId}")
    public AdminContactMessageResponse getContactMessage(@PathVariable Long messageId) {
        return adminContactMessageService.getContactMessage(messageId);
    }

    @PutMapping("/{messageId}/reviewed")
    public AdminContactMessageResponse markReviewed(@PathVariable Long messageId) {
        return adminContactMessageService.markReviewed(messageId);
    }
}
