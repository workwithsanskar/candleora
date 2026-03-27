package com.candleora.service;

import com.candleora.dto.admin.AdminOrderDetailResponse;
import com.candleora.dto.admin.AdminOrderStatusUpdateRequest;
import com.candleora.dto.admin.AdminOrderSummaryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.dto.order.OrderItemResponse;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.PaymentStatus;
import com.candleora.entity.Product;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
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

    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AdminOrderService(
        CustomerOrderRepository customerOrderRepository,
        ProductRepository productRepository
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminOrderSummaryResponse> getOrders(
        String search,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        int page,
        int size
    ) {
        Specification<CustomerOrder> specification = buildSpecification(search, status, startDate, endDate);
        Page<AdminOrderSummaryResponse> orderPage = customerOrderRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"))
            )
        ).map(this::toSummary);

        return PagedResponse.from(orderPage);
    }

    @Transactional(readOnly = true)
    public AdminOrderDetailResponse getOrder(Long id) {
        return toDetail(findOrder(id));
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AdminOrderDetailResponse updateStatus(Long id, AdminOrderStatusUpdateRequest request) {
        CustomerOrder order = findOrder(id);
        OrderStatus nextStatus = parseStatus(request.status());
        OrderStatus previousStatus = order.getStatus();

        if (previousStatus == nextStatus) {
            return toDetail(order);
        }

        if (previousStatus == OrderStatus.CANCELLED && nextStatus != OrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled orders cannot be reopened");
        }

        if (nextStatus == OrderStatus.PENDING_PAYMENT && previousStatus != OrderStatus.PENDING_PAYMENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move an order back to pending payment");
        }

        if (previousStatus == OrderStatus.PENDING_PAYMENT && isActiveStatus(nextStatus)) {
            decrementStock(order);
            applyEstimatedDelivery(order);
        }

        if (nextStatus == OrderStatus.CANCELLED && previousStatus != OrderStatus.PENDING_PAYMENT) {
            restock(order);
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setCancelledAt(Instant.now());
            if (!StringUtils.hasText(order.getCancellationReason())) {
                order.setCancellationReason("Cancelled from admin panel");
            }
        } else if (nextStatus != OrderStatus.CANCELLED) {
            order.setCancelledAt(null);
            order.setCancellationReason(null);
        }

        if (isActiveStatus(nextStatus) && order.getEstimatedDeliveryStart() == null) {
            applyEstimatedDelivery(order);
        }

        order.setStatus(nextStatus);
        return toDetail(customerOrderRepository.save(order));
    }

    private Specification<CustomerOrder> buildSpecification(
        String search,
        String status,
        LocalDate startDate,
        LocalDate endDate
    ) {
        Specification<CustomerOrder> specification = Specification.where(null);

        if (StringUtils.hasText(status)) {
            OrderStatus parsedStatus = parseStatus(status);
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), parsedStatus)
            );
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

    private void decrementStock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "One or more products on this order are no longer available"
                ));

            if (product.getStock() == null || product.getStock() < item.getQuantity()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock for " + product.getName()
                );
            }

            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }
    }

    private void restock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int currentStock = product.getStock() == null ? 0 : product.getStock();
                product.setStock(currentStock + item.getQuantity());
                productRepository.save(product);
            });
        }
    }

    private AdminOrderSummaryResponse toSummary(CustomerOrder order) {
        return new AdminOrderSummaryResponse(
            order.getId(),
            order.getShippingName(),
            order.getContactEmail(),
            order.getTotalAmount(),
            order.getStatus().name(),
            order.getPaymentStatus().name(),
            order.getPaymentMethod(),
            order.getItems().size(),
            order.getCreatedAt()
        );
    }

    private AdminOrderDetailResponse toDetail(CustomerOrder order) {
        BigDecimal subtotalAmount = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;

        return new AdminOrderDetailResponse(
            order.getId(),
            order.getUser().getId(),
            order.getShippingName(),
            order.getContactEmail(),
            order.getPhone(),
            order.getAlternatePhoneNumber(),
            order.getStatus().name(),
            order.getPaymentStatus().name(),
            order.getPaymentMethod(),
            order.getTotalAmount(),
            subtotalAmount,
            discountAmount,
            order.getCouponCode(),
            order.getCreatedAt(),
            order.getEstimatedDeliveryStart(),
            order.getEstimatedDeliveryEnd(),
            order.getCancelledAt(),
            order.getCancellationReason(),
            order.getAddressLine1(),
            order.getAddressLine2(),
            order.getCity(),
            order.getState(),
            order.getPostalCode(),
            order.getCountry(),
            order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getImageUrl(),
                    item.getQuantity(),
                    item.getPrice()
                ))
                .toList()
        );
    }
}
