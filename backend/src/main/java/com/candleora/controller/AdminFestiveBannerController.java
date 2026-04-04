package com.candleora.controller;

import com.candleora.dto.banner.AdminFestiveBannerRequest;
import com.candleora.dto.banner.AdminFestiveBannerResponse;
import com.candleora.service.FestiveBannerService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/banners")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFestiveBannerController {

    private final FestiveBannerService festiveBannerService;

    public AdminFestiveBannerController(FestiveBannerService festiveBannerService) {
        this.festiveBannerService = festiveBannerService;
    }

    @GetMapping
    public List<AdminFestiveBannerResponse> listBanners() {
        return festiveBannerService.listAdminBanners();
    }

    @GetMapping("/{id}")
    public AdminFestiveBannerResponse getBanner(@PathVariable Long id) {
        return festiveBannerService.getAdminBanner(id);
    }

    @PostMapping
    public AdminFestiveBannerResponse createBanner(@Valid @RequestBody AdminFestiveBannerRequest request) {
        return festiveBannerService.createBanner(request);
    }

    @PutMapping("/{id}")
    public AdminFestiveBannerResponse updateBanner(
        @PathVariable Long id,
        @Valid @RequestBody AdminFestiveBannerRequest request
    ) {
        return festiveBannerService.updateBanner(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteBanner(@PathVariable Long id) {
        festiveBannerService.deleteBanner(id);
    }
}
