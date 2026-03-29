package com.candleora.controller;

import com.candleora.dto.chat.AuraChatRequest;
import com.candleora.dto.chat.AuraChatResponse;
import com.candleora.dto.chat.AuraInteractionEventRequest;
import com.candleora.entity.AppUser;
import com.candleora.security.UserPrincipal;
import com.candleora.service.AuraAnalyticsService;
import com.candleora.service.AuraChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final AuraChatService auraChatService;
    private final AuraAnalyticsService auraAnalyticsService;

    public ChatController(AuraChatService auraChatService, AuraAnalyticsService auraAnalyticsService) {
        this.auraChatService = auraChatService;
        this.auraAnalyticsService = auraAnalyticsService;
    }

    @PostMapping("/chat")
    public AuraChatResponse chat(
        Authentication authentication,
        @Valid @RequestBody AuraChatRequest request
    ) {
        return auraChatService.chat(resolveUser(authentication), request);
    }

    @PostMapping("/chat/events")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logEvent(
        Authentication authentication,
        @Valid @RequestBody AuraInteractionEventRequest request
    ) {
        auraAnalyticsService.recordInteraction(resolveUser(authentication), request);
    }

    private AppUser resolveUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }

        return principal.getUser();
    }
}
