package com.candleora.service;

import com.candleora.dto.admin.AdminAnnouncementRequest;
import com.candleora.dto.admin.AdminAnnouncementResponse;
import com.candleora.dto.content.AnnouncementResponse;
import com.candleora.entity.AnnouncementMessage;
import com.candleora.repository.AnnouncementMessageRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AnnouncementService {

    private final AnnouncementMessageRepository announcementMessageRepository;

    public AnnouncementService(AnnouncementMessageRepository announcementMessageRepository) {
        this.announcementMessageRepository = announcementMessageRepository;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listPublicAnnouncements() {
        return announcementMessageRepository.findAllByActiveTrueOrderByOrderIndexAscIdAsc().stream()
            .map(this::toPublicResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminAnnouncementResponse> listAdminAnnouncements() {
        return announcementMessageRepository.findAllByOrderByOrderIndexAscIdAsc().stream()
            .map(this::toAdminResponse)
            .toList();
    }

    public AdminAnnouncementResponse createAnnouncement(AdminAnnouncementRequest request) {
        AnnouncementMessage announcementMessage = new AnnouncementMessage();
        applyRequest(announcementMessage, request);
        return toAdminResponse(announcementMessageRepository.save(announcementMessage));
    }

    public AdminAnnouncementResponse updateAnnouncement(Long id, AdminAnnouncementRequest request) {
        AnnouncementMessage announcementMessage = announcementMessageRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));

        applyRequest(announcementMessage, request);
        return toAdminResponse(announcementMessageRepository.save(announcementMessage));
    }

    public void deleteAnnouncement(Long id) {
        if (!announcementMessageRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
        }

        announcementMessageRepository.deleteById(id);
    }

    private void applyRequest(AnnouncementMessage announcementMessage, AdminAnnouncementRequest request) {
        String message = StringUtils.trimWhitespace(request.message());
        if (!StringUtils.hasText(message)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement message is required");
        }

        announcementMessage.setMessage(message);
        announcementMessage.setActive(request.active());
        announcementMessage.setOrderIndex(Math.max(0, request.orderIndex()));
    }

    private AnnouncementResponse toPublicResponse(AnnouncementMessage announcementMessage) {
        return new AnnouncementResponse(
            announcementMessage.getId(),
            announcementMessage.getMessage(),
            announcementMessage.getOrderIndex()
        );
    }

    private AdminAnnouncementResponse toAdminResponse(AnnouncementMessage announcementMessage) {
        return new AdminAnnouncementResponse(
            announcementMessage.getId(),
            announcementMessage.getMessage(),
            announcementMessage.isActive(),
            announcementMessage.getOrderIndex(),
            announcementMessage.getCreatedAt(),
            announcementMessage.getUpdatedAt()
        );
    }
}
