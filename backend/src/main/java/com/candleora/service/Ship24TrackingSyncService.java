package com.candleora.service;

import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderStatus;
import com.candleora.repository.CustomerOrderRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class Ship24TrackingSyncService {

    private static final Set<OrderStatus> SYNCABLE_STATUSES = Set.of(
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.OUT_FOR_DELIVERY
    );

    private final CustomerOrderRepository customerOrderRepository;
    private final Ship24Client ship24Client;

    public Ship24TrackingSyncService(
        CustomerOrderRepository customerOrderRepository,
        Ship24Client ship24Client
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.ship24Client = ship24Client;
    }

    @Scheduled(fixedDelayString = "${app.ship24.sync-interval-ms:600000}")
    @Transactional
    public void syncTrackedOrders() {
        List<CustomerOrder> orders = customerOrderRepository.findByTrackingNumberIsNotNullAndStatusIn(SYNCABLE_STATUSES);
        for (CustomerOrder order : orders) {
            Optional<Ship24Client.TrackingSnapshot> snapshotOptional = ship24Client.fetchTracking(order.getTrackingNumber());
            if (snapshotOptional.isEmpty()) {
                continue;
            }

            Ship24Client.TrackingSnapshot snapshot = snapshotOptional.get();
            boolean changed = false;

            if (StringUtils.hasText(snapshot.courierName()) && !snapshot.courierName().equals(order.getCourierName())) {
                order.setCourierName(snapshot.courierName());
                changed = true;
            }

            if (StringUtils.hasText(snapshot.trackingUrl()) && !snapshot.trackingUrl().equals(order.getTrackingUrl())) {
                order.setTrackingUrl(snapshot.trackingUrl());
                changed = true;
            }

            if (snapshot.status() != null && snapshot.status() != order.getStatus()) {
                order.setStatus(snapshot.status());
                changed = true;
            }

            if (snapshot.status() == OrderStatus.DELIVERED) {
                Instant deliveredAt = snapshot.deliveredAt() != null ? snapshot.deliveredAt() : Instant.now();
                if (order.getDeliveredAt() == null || !order.getDeliveredAt().equals(deliveredAt)) {
                    order.setDeliveredAt(deliveredAt);
                    changed = true;
                }
            }

            if (changed) {
                customerOrderRepository.save(order);
            }
        }
    }
}
