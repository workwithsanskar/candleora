package com.candleora.controller;

import com.candleora.dto.replacement.ReplacementRequestDto;
import com.candleora.dto.replacement.ReplacementResponse;
import com.candleora.security.UserPrincipal;
import com.candleora.service.ReplacementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ReplacementController {

    private final ReplacementService replacementService;

    public ReplacementController(ReplacementService replacementService) {
        this.replacementService = replacementService;
    }

    @PostMapping("/orders/{orderId}/replace")
    @PreAuthorize("isAuthenticated()")
    public ReplacementResponse createReplacementRequest(
        Authentication authentication,
        @PathVariable Long orderId,
        @Valid @RequestBody ReplacementRequestDto requestDto
    ) {
        return replacementService.createReplacementRequest(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            orderId,
            requestDto
        );
    }

    @GetMapping("/replacements/{replacementId}")
    @PreAuthorize("isAuthenticated()")
    public ReplacementResponse getReplacement(
        Authentication authentication,
        @PathVariable Long replacementId
    ) {
        return replacementService.getReplacementForUser(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            replacementId
        );
    }
}
