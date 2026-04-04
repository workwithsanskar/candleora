package com.candleora.controller;

import com.candleora.dto.admin.AdminAnnouncementRequest;
import com.candleora.dto.admin.AdminAnnouncementResponse;
import com.candleora.service.AnnouncementService;
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
@RequestMapping("/api/admin/announcements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnnouncementController {

    private final AnnouncementService announcementService;

    public AdminAnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping
    public List<AdminAnnouncementResponse> listAnnouncements() {
        return announcementService.listAdminAnnouncements();
    }

    @PostMapping
    public AdminAnnouncementResponse createAnnouncement(@Valid @RequestBody AdminAnnouncementRequest request) {
        return announcementService.createAnnouncement(request);
    }

    @PutMapping("/{id}")
    public AdminAnnouncementResponse updateAnnouncement(
        @PathVariable Long id,
        @Valid @RequestBody AdminAnnouncementRequest request
    ) {
        return announcementService.updateAnnouncement(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
    }
}
