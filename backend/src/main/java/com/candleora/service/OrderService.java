package com.candleora.service;

import com.candleora.dto.order.OrderItemResponse;
import com.candleora.dto.order.OrderReplacementResponse;
import com.candleora.dto.order.OrderRequestItem;
import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.OrderTrackingEventResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.entity.AppUser;
import com.candleora.entity.CartItem;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.OrderTrackingEvent;
import com.candleora.entity.PaymentProvider;
import com.candleora.entity.PaymentStatus;
import com.candleora.entity.Product;
import com.candleora.entity.ReplacementRequest;
import com.candleora.repository.CartItemRepository;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ReplacementRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OrderService {

    private static final BigDecimal COD_LIMIT = BigDecimal.valueOf(3000);
    private static final List<OrderStatus> TRACKING_FLOW = List.of(
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED
    );
    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of(
        "COD",
        "UPI",
        "CARD",
        "WALLET",
        "NETBANKING"
    );
    private static final Set<String> SUPPORTED_CHECKOUT_SOURCES = Set.of(
        "CART",
        "BUY_NOW"
    );

    private final CustomerOrderRepository customerOrderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ReplacementRepository replacementRepository;
    private final InventoryService inventoryService;
    private final InvoiceService invoiceService;
    private final OrderNotificationService orderNotificationService;
    private final CouponService couponService;
    private final boolean requirePhoneVerificationBeforeOrder;
    private final long cancellationWindowMinutes;

    public OrderService(
        CustomerOrderRepository customerOrderRepository,
        CartItemRepository cartItemRepository,
        ProductRepository productRepository,
        ReplacementRepository replacementRepository,
        InventoryService inventoryService,
        InvoiceService invoiceService,
        OrderNotificationService orderNotificationService,
        CouponService couponService,
        @org.springframework.beans.factory.annotation.Value("${app.auth.require-phone-verification-before-order:false}") boolean requirePhoneVerificationBeforeOrder,
        @org.springframework.beans.factory.annotation.Value("${app.orders.cancellation-window-minutes:1440}") long cancellationWindowMinutes
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.replacementRepository = replacementRepository;
        this.inventoryService = inventoryService;
        this.invoiceService = invoiceService;
        this.orderNotificationService = orderNotificationService;
        this.couponService = couponService;
        this.requirePhoneVerificationBeforeOrder = requirePhoneVerificationBeforeOrder;
        this.cancellationWindowMinutes = cancellationWindowMinutes;
    }

    public OrderResponse placeOrder(AppUser user, PlaceOrderRequest request) {
        String paymentMethod = normalizePaymentMethod(request.paymentMethod());
        if (!"COD".equals(paymentMethod)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Use the online payment endpoint for non-COD orders"
            );
        }

        CustomerOrder order = buildOrder(user, request, paymentMethod);
        validateOrderEligibility(user, order);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPaymentProvider(PaymentProvider.COD);
        order.setPaymentStatus(PaymentStatus.COD_PENDING);
        applyEstimatedDelivery(order);

        CustomerOrder savedOrder = customerOrderRepository.save(order);
        commitDirectSaleStock(savedOrder);
        synchronizeCartAfterSuccessfulOrder(user, savedOrder);
        if (StringUtils.hasText(savedOrder.getCouponCode())) {
            couponService.incrementUsage(savedOrder.getCouponCode());
        }
        orderNotificationService.scheduleOrderConfirmation(savedOrder.getId());
        return toOrderResponse(savedOrder);
    }

    public CustomerOrder createPendingOnlineOrder(AppUser user, PlaceOrderRequest request) {
        return createPendingOnlineOrder(user, request, PaymentProvider.RAZORPAY);
    }

    public CustomerOrder createPendingOnlineOrder(
        AppUser user,
        PlaceOrderRequest request,
        PaymentProvider paymentProvider
    ) {
        String paymentMethod = normalizePaymentMethod(request.paymentMethod());
        if ("COD".equals(paymentMethod)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Use the order endpoint for cash on delivery orders"
            );
        }

        CustomerOrder order = buildOrder(user, request, paymentMethod);
        validateOrderEligibility(user, order);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentProvider(paymentProvider);
        order.setPaymentStatus(PaymentStatus.PENDING);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        reservePendingStock(savedOrder);
        return savedOrder;
    }

    public CustomerOrder attachGatewayOrder(CustomerOrder order, String gatewayOrderId) {
        order.setGatewayOrderId(gatewayOrderId);
        return customerOrderRepository.save(order);
    }

    public CustomerOrder markPaymentFailed(CustomerOrder order) {
        order.setPaymentStatus(PaymentStatus.FAILED);
        releasePendingReservation(order, "Reservation released after payment failure");
        return customerOrderRepository.save(order);
    }

    public OrderResponse finalizeOnlineOrder(
        AppUser user,
        Long orderId,
        String gatewayOrderId,
        String gatewayPaymentId,
        String gatewaySignature
    ) {
        CustomerOrder order = getOrderEntity(user, orderId);

        if (!StringUtils.hasText(order.getGatewayOrderId()) || !order.getGatewayOrderId().equals(gatewayOrderId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gateway order does not match");
        }

        order.setGatewayPaymentId(gatewayPaymentId);
        order.setGatewaySignature(gatewaySignature);
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.CONFIRMED);
        applyEstimatedDelivery(order);

        commitReservedStock(order);
        synchronizeCartAfterSuccessfulOrder(user, order);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        if (StringUtils.hasText(savedOrder.getCouponCode())) {
            couponService.incrementUsage(savedOrder.getCouponCode());
        }
        orderNotificationService.scheduleOrderConfirmation(savedOrder.getId());
        return toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(AppUser user) {
        return customerOrderRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::toOrderResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(AppUser user, Long orderId) {
        return toOrderResponse(getOrderEntity(user, orderId));
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderForTracking(Long orderId, String contactEmail) {
        return toOrderResponse(getOrderEntityForTracking(orderId, contactEmail));
    }

    public OrderResponse cancelOrder(AppUser user, Long orderId, String reason) {
        CustomerOrder order = getOrderEntity(user, orderId);
        if (!canCancel(order)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Order can no longer be cancelled online"
            );
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setCancelledAt(Instant.now());
        if (StringUtils.hasText(reason)) {
            order.setCancellationReason(reason.trim());
        }

        if (previousStatus == OrderStatus.CONFIRMED) {
            restock(order);
        } else if (previousStatus == OrderStatus.PENDING_PAYMENT) {
            releasePendingReservation(order, "Reservation released after order cancellation");
        }

        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return toOrderResponse(savedOrder);
    }

    public CustomerOrder getOrderEntity(AppUser user, Long orderId) {
        return customerOrderRepository.findByIdAndUser(orderId, user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @Transactional(readOnly = true)
    public CustomerOrder getOrderEntityForTracking(Long orderId, String contactEmail) {
        if (!StringUtils.hasText(contactEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Billing email is required");
        }

        return customerOrderRepository.findByIdAndContactEmailIgnoreCase(orderId, contactEmail.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private CustomerOrder buildOrder(AppUser user, PlaceOrderRequest request, String paymentMethod) {
        List<OrderLine> orderLines = resolveOrderLines(user, request.items());
        CustomerOrder order = new CustomerOrder();
        order.setUser(user);
        order.setShippingName(request.shippingName());
        order.setPhone(request.phone());
        order.setContactEmail(resolveContactEmail(user, request));
        order.setAlternatePhoneNumber(trimToNull(request.alternatePhoneNumber()));
        order.setAddressLine1(request.addressLine1());
        order.setAddressLine2(trimToNull(request.addressLine2()));
        order.setCity(request.city());
        order.setState(request.state());
        order.setPostalCode(request.postalCode());
        order.setCountry(trimToNull(request.country()));
        order.setLocationLabel(trimToNull(request.locationLabel()));
        order.setLatitude(request.latitude());
        order.setLongitude(request.longitude());
        order.setPaymentMethod(paymentMethod);
        order.setCheckoutSource(normalizeCheckoutSource(request.checkoutSource()));

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotalAmount = BigDecimal.ZERO;

        for (OrderLine orderLine : orderLines) {
            inventoryService.validateAvailableStock(orderLine.product(), orderLine.quantity());
            OrderItem item = createOrderItem(orderLine.product(), orderLine.quantity());
            item.setOrder(order);
            orderItems.add(item);
            subtotalAmount = subtotalAmount.add(
                orderLine.product().getPrice().multiply(BigDecimal.valueOf(orderLine.quantity()))
            );
        }

        order.setItems(orderItems);
        order.setSubtotalAmount(subtotalAmount);
        applyCoupon(order, request.couponCode());
        return order;
    }

    private List<OrderLine> resolveOrderLines(AppUser user, List<OrderRequestItem> requestItems) {
        if (requestItems != null && !requestItems.isEmpty()) {
            return requestItems.stream()
                .map(item -> new OrderLine(findProduct(item.productId()), item.quantity()))
                .toList();
        }

        List<CartItem> cartItems = cartItemRepository.findByUserOrderByIdAsc(user);
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        return cartItems.stream()
            .map(item -> new OrderLine(item.getProduct(), item.getQuantity()))
            .toList();
    }

    private void commitDirectSaleStock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            inventoryService.commitDirectSale(product, item.getQuantity(), order.getId());
        }
    }

    private void reservePendingStock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            inventoryService.reserveForPendingOrder(product, item.getQuantity(), order.getId());
        }
    }

    private void releasePendingReservation(CustomerOrder order, String note) {
        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            inventoryService.releasePendingReservation(product, item.getQuantity(), order.getId(), note);
        }
    }

    private void commitReservedStock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            inventoryService.commitReservedOrder(product, item.getQuantity(), order.getId());
        }
    }

    private void restock(CustomerOrder order) {
        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            inventoryService.restockFromCancelledOrder(product, item.getQuantity(), order.getId());
        }
    }

    private void synchronizeCartAfterSuccessfulOrder(AppUser user, CustomerOrder order) {
        if (user == null || order == null || !"CART".equals(order.getCheckoutSource())) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            Product product = findProduct(item.getProductId());
            cartItemRepository.findByUserAndProduct(user, product).ifPresent(cartItem -> {
                int remainingQuantity = cartItem.getQuantity() - item.getQuantity();
                if (remainingQuantity > 0) {
                    cartItem.setQuantity(remainingQuantity);
                    cartItemRepository.save(cartItem);
                    return;
                }

                cartItemRepository.delete(cartItem);
            });
        }
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private OrderItem createOrderItem(Product product, Integer quantity) {
        OrderItem item = new OrderItem();
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setImageUrl(product.getImageUrls().isEmpty() ? "" : product.getImageUrls().get(0));
        item.setQuantity(quantity);
        item.setPrice(product.getPrice());
        return item;
    }

    private OrderResponse toOrderResponse(CustomerOrder order) {
        Instant cancelDeadline = getCancellationDeadline(order);
        boolean canCancel = canCancel(order);
        boolean canReplace = canReplace(order);

        BigDecimal subtotalAmount = order.getSubtotalAmount() != null
            ? order.getSubtotalAmount()
            : order.getTotalAmount();
        BigDecimal discountAmount = order.getDiscountAmount() != null
            ? order.getDiscountAmount()
            : BigDecimal.ZERO;
        Map<Long, OrderReplacementResponse> replacements = buildReplacementSummaryMap(order);

        return new OrderResponse(
            order.getId(),
            order.getStatus().name(),
            order.getPaymentProvider().name(),
            order.getPaymentStatus().name(),
            order.getPaymentMethod(),
            order.getTotalAmount(),
            subtotalAmount,
            discountAmount,
            order.getCouponCode(),
            order.getCreatedAt(),
            order.getEstimatedDeliveryStart(),
            order.getEstimatedDeliveryEnd(),
            order.getGatewayOrderId(),
            order.getGatewayPaymentId(),
            invoiceService.isInvoiceAvailable(order) ? invoiceService.buildInvoiceNumber(order) : null,
            order.getShippingName(),
            order.getContactEmail(),
            order.getPhone(),
            order.getAlternatePhoneNumber(),
            order.getAddressLine1(),
            order.getAddressLine2(),
            order.getCity(),
            order.getState(),
            order.getPostalCode(),
            order.getCountry(),
            order.getLocationLabel(),
            order.getLatitude(),
            order.getLongitude(),
            canCancel,
            cancelDeadline,
            order.getCancelledAt(),
            order.getCancellationReason(),
            order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getImageUrl(),
                    item.getQuantity(),
                    item.getPrice()
                ))
                .toList(),
            order.getTrackingNumber(),
            order.getCourierName(),
            order.getTrackingUrl(),
            order.getDeliveredAt(),
            buildTrackingEvents(order),
            canReplace,
            replacements
        );
    }

    private void applyEstimatedDelivery(CustomerOrder order) {
        order.setEstimatedDeliveryStart(LocalDate.now().plusDays(3));
        order.setEstimatedDeliveryEnd(LocalDate.now().plusDays(6));
    }

    private String resolveContactEmail(AppUser user, PlaceOrderRequest request) {
        if (StringUtils.hasText(request.contactEmail())) {
            return request.contactEmail().trim();
        }

        if (StringUtils.hasText(user.getEmail())) {
            return user.getEmail();
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contact email is required");
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (!StringUtils.hasText(paymentMethod)) {
            return "COD";
        }
        String normalized = paymentMethod.trim().toUpperCase();
        if (!SUPPORTED_PAYMENT_METHODS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment method");
        }
        return normalized;
    }

    private String normalizeCheckoutSource(String checkoutSource) {
        if (!StringUtils.hasText(checkoutSource)) {
            return "CART";
        }

        String normalized = checkoutSource.trim().toUpperCase();
        if (!SUPPORTED_CHECKOUT_SOURCES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported checkout source");
        }

        return normalized;
    }

    private void validateOrderEligibility(AppUser user, CustomerOrder order) {
        if (requirePhoneVerificationBeforeOrder && !user.isPhoneVerified()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Verify your phone number before placing an order"
            );
        }

        if ("COD".equals(order.getPaymentMethod()) && order.getTotalAmount().compareTo(COD_LIMIT) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cash on delivery is available only for orders up to Rs. 3000"
            );
        }
    }

    private void applyCoupon(CustomerOrder order, String couponCode) {
        if (!StringUtils.hasText(couponCode)) {
            order.setCouponCode(null);
            order.setDiscountAmount(BigDecimal.ZERO);
            order.setTotalAmount(order.getSubtotalAmount());
            return;
        }

        CouponService.CouponQuote quote = couponService.quoteCoupon(order.getUser(), couponCode, order.getItems().stream()
            .map(item -> new OrderRequestItem(item.getProductId(), item.getQuantity()))
            .toList());
        order.setCouponCode(quote.code());
        order.setDiscountAmount(quote.discountAmount());
        order.setTotalAmount(quote.totalAmount());
    }

    public boolean canCancel(CustomerOrder order) {
        if (order == null || order.getCreatedAt() == null) {
            return false;
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            return false;
        }

        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            return false;
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            return false;
        }

        Instant deadline = getCancellationDeadline(order);
        return deadline != null && Instant.now().isBefore(deadline);
    }

    public boolean canReplace(CustomerOrder order) {
        if (order == null || order.getDeliveredAt() == null) {
            return false;
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            return false;
        }

        return order.getDeliveredAt()
            .plus(Duration.ofDays(3))
            .isAfter(Instant.now());
    }

    private Instant getCancellationDeadline(CustomerOrder order) {
        if (order == null || order.getCreatedAt() == null) {
            return null;
        }

        return order.getCreatedAt().plus(Duration.ofMinutes(cancellationWindowMinutes));
    }

    private Map<Long, OrderReplacementResponse> buildReplacementSummaryMap(CustomerOrder order) {
        Map<Long, OrderReplacementResponse> replacements = new LinkedHashMap<>();
        for (ReplacementRequest request : replacementRepository.findByOrderIdOrderByRequestedAtDesc(order.getId())) {
            replacements.putIfAbsent(request.getOrderItemId(), toReplacementSummary(request));
        }
        return replacements;
    }

    private OrderReplacementResponse toReplacementSummary(ReplacementRequest request) {
        List<String> proofAssetUrls = resolveProofAssetUrls(request);
        return new OrderReplacementResponse(
            request.getId(),
            request.getOrderItemId(),
            request.getProductId(),
            request.getProductName(),
            request.getProductImageUrl(),
            request.getReason(),
            request.getCustomerNote(),
            request.getStatus().name(),
            request.getRequestedAt(),
            request.getApprovedAt(),
            request.getProofImageUrl(),
            proofAssetUrls,
            request.getAdminNote(),
            request.getIsFraudSuspected(),
            request.getPickupReference(),
            request.getPickupStatus()
        );
    }

    private List<String> resolveProofAssetUrls(ReplacementRequest request) {
        if (StringUtils.hasText(request.getProofAssetUrls())) {
            return request.getProofAssetUrls().lines()
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        }

        if (StringUtils.hasText(request.getProofImageUrl())) {
            return List.of(request.getProofImageUrl().trim());
        }

        return List.of();
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

    private int trackingStepIndex(OrderStatus status) {
        return TRACKING_FLOW.indexOf(status);
    }

    private record OrderLine(Product product, Integer quantity) {
    }
}
