package com.candleora.controller;

import com.candleora.dto.banner.FestiveBannerPopupResponse;
import com.candleora.service.FestiveBannerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banners")
public class FestiveBannerController {

    private final FestiveBannerService festiveBannerService;

    public FestiveBannerController(FestiveBannerService festiveBannerService) {
        this.festiveBannerService = festiveBannerService;
    }

    @GetMapping("/active")
    public ResponseEntity<FestiveBannerPopupResponse> getActiveBanner() {
        FestiveBannerPopupResponse banner = festiveBannerService.getActiveBanner();
        return banner == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(banner);
    }
}
