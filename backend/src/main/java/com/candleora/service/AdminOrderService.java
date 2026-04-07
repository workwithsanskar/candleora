package com.candleora.service;

import com.candleora.dto.admin.AdminOrderDetailResponse;
import com.candleora.dto.admin.AdminOrderItemResponse;
import com.candleora.dto.admin.AdminOrderItemReviewResponse;
import com.candleora.dto.admin.AdminOrderTrackingEventRequest;
import com.candleora.dto.admin.AdminOrderTrackingUpdateRequest;
import com.candleora.dto.admin.AdminOrderStatusUpdateRequest;
import com.candleora.dto.admin.AdminOrderSummaryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.dto.order.OrderTrackingEventResponse;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.OrderTrackingEvent;
import com.candleora.entity.PaymentStatus;
import com.candleora.entity.Product;
import com.candleora.entity.ProductReview;
import com.candleora.entity.ReplacementRequest;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductReviewRepository;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ReplacementRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.cache.annotation.CacheEvict;
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
public class AdminOrderService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final List<OrderStatus> TRACKING_FLOW = List.of(
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED
    );

    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;
    private final ReplacementRepository replacementRepository;
    private final InventoryService inventoryService;
    private final InvoiceService invoiceService;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AdminOrderService(
        CustomerOrderRepository customerOrderRepository,
        ProductRepository productRepository,
        ProductReviewRepository productReviewRepository,
        ReplacementRepository replacementRepository,
        InventoryService inventoryService,
        InvoiceService invoiceService
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
        this.replacementRepository = replacementRepository;
        this.inventoryService = inventoryService;
        this.invoiceService = invoiceService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminOrderSummaryResponse> getOrders(
        String search,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        Boolean reviewed,
        int page,
        int size
    ) {
        Specification<CustomerOrder> specification = buildSpecification(search, status, startDate, endDate, reviewed);
        Page<CustomerOrder> orderPage = customerOrderRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"))
            )
        );

        Map<Long, ReplacementRequest> latestReplacements = resolveLatestReplacements(orderPage.getContent());
        List<AdminOrderSummaryResponse> summaries = orderPage.getContent().stream()
            .map(order -> toSummary(order, latestReplacements.get(order.getId())))
            .toList();

        return new PagedResponse<>(
            summaries,
            orderPage.getNumber(),
            orderPage.getSize(),
            orderPage.getTotalElements(),
            orderPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getOrder(Long id) {
        CustomerOrder order = findOrder(id);
        return toDetail(order, resolveLatestReplacement(order.getId()));
    }

    @Transactional(readOnly = true)
    public CustomerOrder getOrderEntity(Long id) {
        return findOrder(id);
    }

    public AdminOrderDetailResponse markReviewed(Long id) {
        CustomerOrder order = findOrder(id);
        applyAdminReviewed(order);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return toDetail(savedOrder, resolveLatestReplacement(savedOrder.getId()));
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AdminOrderDetailResponse updateStatus(Long id, AdminOrderStatusUpdateRequest request) {
        CustomerOrder order = findOrder(id);
        applyAdminReviewed(order);
        OrderStatus nextStatus = parseStatus(request.status());
        OrderStatus previousStatus = order.getStatus();

        if (previousStatus == nextStatus) {
            return toDetail(order, resolveLatestReplacement(order.getId()));
        }

        if (previousStatus == OrderStatus.CANCELLED && nextStatus != OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled orders cannot be reopened");
        }

        if (nextStatus == OrderStatus.PENDING_PAYMENT && previousStatus != OrderStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move an order back to pending payment");
        }

        if (previousStatus == OrderStatus.PENDING_PAYMENT && isActiveStatus(nextStatus)) {
            commitReservedStock(order);
            applyEstimatedDelivery(order);
        }

        if (nextStatus == OrderStatus.CANCELLED) {
            if (previousStatus == OrderStatus.PENDING_PAYMENT) {
                releasePendingReservation(order, "Reservation released from admin cancellation");
            } else {
                restock(order);
            }
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setCancelledAt(Instant.now());
            if (!StringUtils.hasText(order.getCancellationReason())) {
                order.setCancellationReason("Cancelled from admin panel");
            }
        } else if (nextStatus != OrderStatus.CANCELLED) {
            order.setCancelledAt(null);
            order.setCancellationReason(null);
        }

        if (nextStatus == OrderStatus.DELIVERED) {
            if (order.getDeliveredAt() == null) {
                order.setDeliveredAt(Instant.now());
            }
        } else {
            order.setDeliveredAt(null);
        }

        if (isActiveStatus(nextStatus) && order.getEstimatedDeliveryStart() == null) {
            applyEstimatedDelivery(order);
        }

        order.setStatus(nextStatus);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return toDetail(savedOrder, resolveLatestReplacement(savedOrder.getId()));
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AdminOrderDetailResponse updateTracking(Long id, AdminOrderTrackingUpdateRequest request) {
        CustomerOrder order = findOrder(id);
        applyAdminReviewed(order);

        order.setTrackingNumber(trimToNull(request.trackingNumber()));
        order.setCourierName(trimToNull(request.courierName()));
        order.setTrackingUrl(trimToNull(request.trackingUrl()));

        syncTrackingEvents(order, request.events());
        advanceStatusFromTracking(order);

        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return toDetail(savedOrder, resolveLatestReplacement(savedOrder.getId()));
    }

    private Specification<CustomerOrder> buildSpecification(
        String search,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        Boolean reviewed
    ) {
        Specification<CustomerOrder> specification = Specification.where(null);

        if (StringUtils.hasText(status)) {
            String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
            if ("REPLACEMENT".equals(normalizedStatus)) {
                specification = specification.and((root, query, criteriaBuilder) -> {
                    var subquery = query.subquery(Long.class);
                    var replacementRoot = subquery.from(ReplacementRequest.class);
                    subquery.select(replacementRoot.get("id"));
                    subquery.where(criteriaBuilder.equal(replacementRoot.get("order"), root));
                    return criteriaBuilder.exists(subquery);
                });
            } else {
                OrderStatus parsedStatus = parseStatus(status);
                specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), parsedStatus)
                );
            }
        }

        if (StringUtils.hasText(search)) {
            String keyword = search.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, criteriaBuilder) -> {
                String likeValue = "%" + keyword + "%";
                if (keyword.matches("\\d+")) {
                    return criteriaBuilder.or(
                        criteriaBuilder.equal(root.get("id"), Long.valueOf(keyword)),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("shippingName")), likeValue),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("contactEmail")), likeValue),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), likeValue)
                    );
                }
                return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("shippingName")), likeValue),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contactEmail")), likeValue),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), likeValue)
                );
            });
        }

        if (startDate != null) {
            Instant startInstant = startDate.atStartOfDay(zoneId).toInstant();
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startInstant)
            );
        }

        if (endDate != null) {
            Instant endInstant = endDate.plusDays(1).atStartOfDay(zoneId).toInstant();
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.lessThan(root.get("createdAt"), endInstant)
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

        return specification;
    }

    private CustomerOrder findOrder(Long id) {
        return customerOrderRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private OrderStatus parseStatus(String status) {
        try {
            return OrderStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status");
        }
    }

    private OrderStatus parseTrackingStatus(String status) {
        OrderStatus parsedStatus = parseStatus(status);
        if (!TRACKING_FLOW.contains(parsedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported tracking step");
        }
        return parsedStatus;
    }

    private boolean isActiveStatus(OrderStatus status) {
        return status == OrderStatus.CONFIRMED
            || status == OrderStatus.SHIPPED
            || status == OrderStatus.OUT_FOR_DELIVERY
            || status == OrderStatus.DELIVERED;
    }

    private void applyEstimatedDelivery(CustomerOrder order) {
        order.setEstimatedDeliveryStart(LocalDate.now(zoneId).plusDays(3));
        order.setEstimatedDeliveryEnd(LocalDate.now(zoneId).plusDays(6));
    }

    private void commitReservedStock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "One or more products on this order are no longer available"
                ));
            inventoryService.commitReservedOrder(product, item.getQuantity(), order.getId());
        }
    }

    private void restock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                inventoryService.restockFromCancelledOrder(product, item.getQuantity(), order.getId());
            });
        }
    }

    private void releasePendingReservation(CustomerOrder order, String note) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product ->
                inventoryService.releasePendingReservation(product, item.getQuantity(), order.getId(), note)
            );
        }
    }

    private void syncTrackingEvents(CustomerOrder order, List<AdminOrderTrackingEventRequest> events) {
        Set<OrderStatus> retainedStatuses = new HashSet<>();

        if (events != null) {
            for (AdminOrderTrackingEventRequest eventRequest : events) {
                OrderStatus status = parseTrackingStatus(eventRequest.status());
                String detail = trimToNull(eventRequest.detail());
                Instant timestamp = eventRequest.timestamp();

                if (detail == null && timestamp == null) {
                    continue;
                }

                retainedStatuses.add(status);
                OrderTrackingEvent trackingEvent = order.getTrackingEvents().stream()
                    .filter(existingEvent -> existingEvent.getStatus() == status)
                    .findFirst()
                    .orElseGet(() -> {
                        OrderTrackingEvent createdEvent = new OrderTrackingEvent();
                        createdEvent.setOrder(order);
                        createdEvent.setStatus(status);
                        order.getTrackingEvents().add(createdEvent);
                        return createdEvent;
                    });

                trackingEvent.setDetail(detail);
                trackingEvent.setEventTimestamp(timestamp);
            }
        }

        order.getTrackingEvents().removeIf(event -> !retainedStatuses.contains(event.getStatus()));
    }

    private void advanceStatusFromTracking(CustomerOrder order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        OrderStatus highestTrackedStatus = order.getTrackingEvents().stream()
            .filter(event -> event.getEventTimestamp() != null)
            .map(OrderTrackingEvent::getStatus)
            .filter(TRACKING_FLOW::contains)
            .max(Comparator.comparingInt(this::trackingStepIndex))
            .orElse(null);

        if (
            highestTrackedStatus != null &&
            trackingStepIndex(highestTrackedStatus) > trackingStepIndex(order.getStatus())
        ) {
            order.setStatus(highestTrackedStatus);
        }

        order.getTrackingEvents().stream()
            .filter(event -> event.getStatus() == OrderStatus.DELIVERED)
            .map(OrderTrackingEvent::getEventTimestamp)
            .filter(timestamp -> timestamp != null)
            .findFirst()
            .ifPresent(order::setDeliveredAt);
    }

    private int trackingStepIndex(OrderStatus status) {
        return TRACKING_FLOW.indexOf(status);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private void applyAdminReviewed(CustomerOrder order) {
        if (order.getAdminReviewedAt() == null) {
            order.setAdminReviewedAt(Instant.now());
        }
    }

    private Map<Long, ReplacementRequest> resolveLatestReplacements(List<CustomerOrder> orders) {
        Set<Long> orderIds = orders.stream()
            .map(CustomerOrder::getId)
            .collect(java.util.stream.Collectors.toSet());

        if (orderIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, ReplacementRequest> replacementsByOrderId = new LinkedHashMap<>();
        for (ReplacementRequest replacement : replacementRepository.findByOrderIdInOrderByRequestedAtDesc(orderIds)) {
            replacementsByOrderId.putIfAbsent(replacement.getOrder().getId(), replacement);
        }

        return replacementsByOrderId;
    }

    private ReplacementRequest resolveLatestReplacement(Long orderId) {
        return replacementRepository.findTopByOrderIdOrderByRequestedAtDesc(orderId).orElse(null);
    }

    private AdminOrderSummaryResponse toSummary(CustomerOrder order, ReplacementRequest replacement) {
        return new AdminOrderSummaryResponse(
            order.getId(),
            order.getShippingName(),
            order.getContactEmail(),
            order.getTotalAmount(),
            order.getStatus().name(),
            replacement != null,
            replacement != null ? replacement.getStatus().name() : null,
            order.getPaymentStatus().name(),
            order.getPaymentMethod(),
            order.getItems().size(),
            order.getCreatedAt(),
            order.getAdminReviewedAt()
        );
    }

    private AdminOrderDetailResponse toDetail(CustomerOrder order, ReplacementRequest replacement) {
        BigDecimal subtotalAmount = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        boolean invoiceAvailable = invoiceService.isInvoiceAvailable(order);
        String invoiceNumber = invoiceAvailable ? invoiceService.buildInvoiceNumber(order) : null;
        Map<Long, ProductReview> reviewsByProductId = resolveReviewsByProductId(order);

        return new AdminOrderDetailResponse(
            order.getId(),
            order.getUser().getId(),
            order.getShippingName(),
            order.getContactEmail(),
            order.getPhone(),
            order.getAlternatePhoneNumber(),
            order.getStatus().name(),
            replacement != null,
            replacement != null ? replacement.getStatus().name() : null,
            order.getPaymentStatus().name(),
            order.getPaymentMethod(),
            order.getTotalAmount(),
            subtotalAmount,
            discountAmount,
            order.getCouponCode(),
            invoiceAvailable,
            invoiceNumber,
            order.getCreatedAt(),
            order.getEstimatedDeliveryStart(),
            order.getEstimatedDeliveryEnd(),
            order.getTrackingNumber(),
            order.getCourierName(),
            order.getTrackingUrl(),
            order.getDeliveredAt(),
            order.getAdminReviewedAt(),
            order.getCancelledAt(),
            order.getCancellationReason(),
            order.getAddressLine1(),
            order.getAddressLine2(),
            order.getCity(),
            order.getState(),
            order.getPostalCode(),
            order.getCountry(),
            order.getItems().stream()
                .map(item -> new AdminOrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getImageUrl(),
                    item.getQuantity(),
                    item.getPrice(),
                    toItemReview(reviewsByProductId.get(item.getProductId()))
                ))
                .toList(),
            buildTrackingEvents(order)
        );
    }

    private Map<Long, ProductReview> resolveReviewsByProductId(CustomerOrder order) {
        List<Long> productIds = order.getItems().stream()
            .map(OrderItem::getProductId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();

        if (productIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, ProductReview> reviewsByProductId = new LinkedHashMap<>();
        Long reviewerUserId = order.getUser() != null ? order.getUser().getId() : null;

        if (reviewerUserId != null) {
            for (ProductReview review : productReviewRepository.findAllByProductIdInAndReviewerUserId(productIds, reviewerUserId)) {
                reviewsByProductId.putIfAbsent(review.getProduct().getId(), review);
            }
        }

        String reviewerEmail = StringUtils.hasText(order.getContactEmail()) ? order.getContactEmail().trim() : null;
        if (reviewerEmail != null) {
            for (ProductReview review : productReviewRepository.findAllByProductIdInAndReviewerEmailIgnoreCase(productIds, reviewerEmail)) {
                reviewsByProductId.putIfAbsent(review.getProduct().getId(), review);
            }
        }

        return reviewsByProductId;
    }

    private AdminOrderItemReviewResponse toItemReview(ProductReview review) {
        if (review == null) {
            return null;
        }

        return new AdminOrderItemReviewResponse(
            review.getId(),
            review.getRating(),
            review.getMessage(),
            review.getReviewerName(),
            review.getReviewerEmail(),
            review.getCreatedAt()
        );
    }

    private List<OrderTrackingEventResponse> buildTrackingEvents(CustomerOrder order) {
        return order.getTrackingEvents().stream()
            .sorted(Comparator
                .comparingInt((OrderTrackingEvent event) -> trackingStepIndex(event.getStatus()))
                .thenComparing(OrderTrackingEvent::getEventTimestamp, Comparator.nullsLast(Comparator.naturalOrder()))
            )
            .map(event -> new OrderTrackingEventResponse(
                event.getStatus().name(),
                event.getDetail(),
                event.getEventTimestamp()
            ))
            .toList();
    }
}
