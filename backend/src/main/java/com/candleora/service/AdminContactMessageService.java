package com.candleora.service;

import com.candleora.dto.admin.AdminContactMessageResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.entity.ContactMessage;
import com.candleora.repository.ContactMessageRepository;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AdminContactMessageService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ContactMessageRepository contactMessageRepository;

    public AdminContactMessageService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminContactMessageResponse> getContactMessages(
        String search,
        Boolean reviewed,
        int page,
        int size
    ) {
        Specification<ContactMessage> specification = Specification.where(null);

        if (StringUtils.hasText(search)) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("subject")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("message")), keyword)
                )
            );
        }

        if (Boolean.TRUE.equals(reviewed)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.isNotNull(root.get("adminReviewedAt"))
            );
        } else if (Boolean.FALSE.equals(reviewed)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.isNull(root.get("adminReviewedAt"))
            );
        }

        Page<AdminContactMessageResponse> messagesPage = contactMessageRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"))
            )
        ).map(this::toResponse);

        return PagedResponse.from(messagesPage);
    }

    @Transactional(readOnly = true)
    public AdminContactMessageResponse getContactMessage(Long messageId) {
        ContactMessage message = contactMessageRepository.findById(messageId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact message not found"));
        return toResponse(message);
    }

    public AdminContactMessageResponse markReviewed(Long messageId) {
        ContactMessage message = contactMessageRepository.findById(messageId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact message not found"));

        if (message.getAdminReviewedAt() == null) {
            message.setAdminReviewedAt(LocalDateTime.now());
        }

        return toResponse(message);
    }

    private AdminContactMessageResponse toResponse(ContactMessage message) {
        return new AdminContactMessageResponse(
            message.getId(),
            message.getName(),
            message.getEmail(),
            message.getPhone(),
            message.getSubject(),
            message.getMessage(),
            message.getCreatedAt(),
            message.getAdminReviewedAt()
        );
    }
}
