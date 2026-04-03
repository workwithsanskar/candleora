package com.candleora.controller;

import com.candleora.dto.common.PagedResponse;
import com.candleora.dto.replacement.ReplacementBulkApproveRequest;
import com.candleora.dto.replacement.ReplacementDecisionRequest;
import com.candleora.dto.replacement.ReplacementResponse;
import com.candleora.service.ReplacementService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/replacements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReplacementController {

    private final ReplacementService replacementService;

    public AdminReplacementController(ReplacementService replacementService) {
        this.replacementService = replacementService;
    }

    @GetMapping
    public PagedResponse<ReplacementResponse> getReplacements(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Boolean fraud,
        @RequestParam(required = false) Boolean reviewed,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return replacementService.getAdminReplacements(status, fraud, reviewed, page, size);
    }

    @GetMapping("/{replacementId}")
    public ReplacementResponse getReplacement(@PathVariable Long replacementId) {
        return replacementService.getAdminReplacement(replacementId);
    }

    @PutMapping("/{replacementId}/reviewed")
    public ReplacementResponse markReviewed(@PathVariable Long replacementId) {
        return replacementService.markReviewed(replacementId);
    }

    @PostMapping("/{replacementId}/approve")
    public ReplacementResponse approveReplacement(
        @PathVariable Long replacementId,
        @RequestBody(required = false) ReplacementDecisionRequest request
    ) {
        return replacementService.approveReplacement(
            replacementId,
            request != null ? request.adminNote() : null
        );
    }

    @PostMapping("/{replacementId}/reject")
    public ReplacementResponse rejectReplacement(
        @PathVariable Long replacementId,
        @RequestBody(required = false) ReplacementDecisionRequest request
    ) {
        return replacementService.rejectReplacement(
            replacementId,
            request != null ? request.adminNote() : null
        );
    }

    @PostMapping("/bulk-approve")
    public List<ReplacementResponse> bulkApprove(@Valid @RequestBody ReplacementBulkApproveRequest request) {
        return replacementService.bulkApprove(request.ids(), request.adminNote());
    }
}
