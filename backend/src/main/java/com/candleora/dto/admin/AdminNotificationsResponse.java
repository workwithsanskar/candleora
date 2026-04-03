package com.candleora.dto.admin;

import java.util.List;

public record AdminNotificationsResponse(
    long unreadOrders,
    long unreadContactMessages,
    long unreadReplacements,
    long totalUnread,
    List<AdminNotificationItemResponse> items
) {
}
