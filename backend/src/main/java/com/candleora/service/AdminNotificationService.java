package com.candleora.service;

import com.candleora.dto.admin.AdminNotificationItemResponse;
import com.candleora.dto.admin.AdminNotificationsResponse;
import com.candleora.entity.ContactMessage;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.ReplacementRequest;
import com.candleora.repository.ContactMessageRepository;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ReplacementRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminNotificationService {

    private static final int MAX_LIMIT = 12;

    private final CustomerOrderRepository customerOrderRepository;
    private final ContactMessageRepository contactMessageRepository;
    private final ReplacementRepository replacementRepository;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AdminNotificationService(
        CustomerOrderRepository customerOrderRepository,
        ContactMessageRepository contactMessageRepository,
        ReplacementRepository replacementRepository
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.contactMessageRepository = contactMessageRepository;
        this.replacementRepository = replacementRepository;
    }

    @Transactional(readOnly = true)
    public AdminNotificationsResponse getNotifications(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
        long unreadOrders = customerOrderRepository.countByAdminReviewedAtIsNull();
        long unreadContactMessages = contactMessageRepository.countByAdminReviewedAtIsNull();
        long unreadReplacements = replacementRepository.countByAdminReviewedAtIsNull();

        List<AdminNotificationItemResponse> items = new ArrayList<>();
        PageRequest request = PageRequest.of(0, safeLimit);

        customerOrderRepository.findByAdminReviewedAtIsNullOrderByCreatedAtDesc(request)
            .stream()
            .map(this::toOrderNotification)
            .forEach(items::add);

        contactMessageRepository.findByAdminReviewedAtIsNullOrderByCreatedAtDesc(request)
            .stream()
            .map(this::toContactNotification)
            .forEach(items::add);

        replacementRepository.findByAdminReviewedAtIsNullOrderByRequestedAtDesc(request)
            .stream()
            .map(this::toReplacementNotification)
            .forEach(items::add);

        List<AdminNotificationItemResponse> latestItems = items.stream()
            .sorted(Comparator.comparing(AdminNotificationItemResponse::timestamp).reversed())
            .limit(safeLimit)
            .toList();

        return new AdminNotificationsResponse(
            unreadOrders,
            unreadContactMessages,
            unreadReplacements,
            unreadOrders + unreadContactMessages + unreadReplacements,
            latestItems
        );
    }

    public AdminNotificationsResponse markAllReviewed(int limit) {
        Instant now = Instant.now();
        customerOrderRepository.markAllUnreadReviewed(now);
        replacementRepository.markAllUnreadReviewed(now);
        contactMessageRepository.markAllUnreadReviewed(LocalDateTime.ofInstant(now, zoneId));
        return getNotifications(limit);
    }

    private AdminNotificationItemResponse toOrderNotification(CustomerOrder order) {
        return new AdminNotificationItemResponse(
            "ORDER",
            order.getId(),
            "Order #" + order.getId(),
            order.getShippingName(),
            order.getItems().size() + " item" + (order.getItems().size() == 1 ? "" : "s") + " awaiting review",
            order.getCreatedAt()
        );
    }

    private AdminNotificationItemResponse toContactNotification(ContactMessage message) {
        Instant timestamp = message.getCreatedAt().atZone(zoneId).toInstant();
        return new AdminNotificationItemResponse(
            "CONTACT",
            message.getId(),
            message.getSubject(),
            message.getName(),
            message.getEmail(),
            timestamp
        );
    }

    private AdminNotificationItemResponse toReplacementNotification(ReplacementRequest request) {
        return new AdminNotificationItemResponse(
            "REPLACEMENT",
            request.getId(),
            request.getProductName(),
            "Order #" + request.getOrder().getId(),
            request.getReason(),
            request.getRequestedAt()
        );
    }
}
