package com.candleora.service;

import com.candleora.dto.common.PagedResponse;
import com.candleora.dto.replacement.ReplacementRequestDto;
import com.candleora.dto.replacement.ReplacementResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.Product;
import com.candleora.entity.ReplacementRequest;
import com.candleora.entity.ReplacementStatus;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.ReplacementRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
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
public class ReplacementService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ReplacementRepository replacementRepository;
    private final ProductRepository productRepository;
    private final OrderService orderService;
    private final InventoryService inventoryService;
    private final ShiprocketClient shiprocketClient;
    private final OrderNotificationService orderNotificationService;

    public ReplacementService(
        ReplacementRepository replacementRepository,
        ProductRepository productRepository,
        OrderService orderService,
        InventoryService inventoryService,
        ShiprocketClient shiprocketClient,
        OrderNotificationService orderNotificationService
    ) {
        this.replacementRepository = replacementRepository;
        this.productRepository = productRepository;
        this.orderService = orderService;
        this.inventoryService = inventoryService;
        this.shiprocketClient = shiprocketClient;
        this.orderNotificationService = orderNotificationService;
    }

    public ReplacementResponse createReplacementRequest(
        AppUser user,
        Long orderId,
        ReplacementRequestDto requestDto
    ) {
        CustomerOrder order = orderService.getOrderEntity(user, orderId);
        if (!orderService.canReplace(order)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Replacement requests are only available for delivered orders within 3 days of delivery"
            );
        }

        OrderItem orderItem = findOrderItem(order, requestDto.orderItemId());
        if (replacementRepository.existsByOrderIdAndOrderItemId(order.getId(), orderItem.getId())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Only one replacement request is allowed for this item"
            );
        }

        ReplacementRequest replacementRequest = new ReplacementRequest();
        List<String> proofAssetUrls = normalizeProofAssetUrls(requestDto);
        if (proofAssetUrls.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Upload at least one proof image or video before creating a replacement request"
            );
        }

        replacementRequest.setOrder(order);
        replacementRequest.setOrderItemId(orderItem.getId());
        replacementRequest.setProductId(orderItem.getProductId());
        replacementRequest.setProductName(orderItem.getProductName());
        replacementRequest.setProductImageUrl(trimToNull(orderItem.getImageUrl()));
        replacementRequest.setReason(requestDto.reason().trim());
        replacementRequest.setCustomerNote(trimToNull(requestDto.customerNote()));
        replacementRequest.setProofImageUrl(proofAssetUrls.get(0));
        replacementRequest.setProofAssetUrls(serializeProofAssetUrls(proofAssetUrls));
        replacementRequest.setIsFraudSuspected(
            evaluateFraud(user, orderItem.getProductId(), proofAssetUrls)
        );

        ReplacementRequest savedRequest = replacementRepository.save(replacementRequest);
        orderNotificationService.scheduleReplacementSubmitted(savedRequest.getId());
        return toResponse(savedRequest);
    }

    @Transactional(readOnly = true)
    public ReplacementResponse getReplacementForUser(AppUser user, Long replacementId) {
        return toResponse(findForUser(user, replacementId));
    }

    @Transactional(readOnly = true)
    public ReplacementResponse getAdminReplacement(Long replacementId) {
        return toResponse(findReplacement(replacementId));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReplacementResponse> getAdminReplacements(
        String status,
        Boolean fraud,
        Boolean reviewed,
        int page,
        int size
    ) {
        Specification<ReplacementRequest> specification = Specification.where(null);

        if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
            ReplacementStatus parsedStatus = parseStatus(status);
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), parsedStatus)
            );
        }

        if (Boolean.TRUE.equals(fraud)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.isTrue(root.get("isFraudSuspected"))
            );
        } else if (Boolean.FALSE.equals(fraud)) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.isFalse(root.get("isFraudSuspected"))
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

        Page<ReplacementResponse> replacementPage = replacementRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("requestedAt"))
            )
        ).map(this::toResponse);

        return PagedResponse.from(replacementPage);
    }

    public ReplacementResponse markReviewed(Long replacementId) {
        ReplacementRequest replacementRequest = findReplacement(replacementId);
        applyAdminReviewed(replacementRequest);
        return toResponse(replacementRepository.save(replacementRequest));
    }

    public ReplacementResponse approveReplacement(Long replacementId, String adminNote) {
        ReplacementRequest replacementRequest = findReplacement(replacementId);
        if (replacementRequest.getStatus() != ReplacementStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only requested replacements can be approved");
        }

        Product product = findProduct(replacementRequest.getProductId());
        inventoryService.reserveForReplacement(product, 1, replacementRequest.getId());

        replacementRequest.setStatus(ReplacementStatus.APPROVED);
        replacementRequest.setApprovedAt(Instant.now());
        replacementRequest.setAdminNote(trimToNull(adminNote));
        applyAdminReviewed(replacementRequest);

        ShiprocketClient.PickupScheduleResult pickupScheduleResult = shiprocketClient.scheduleReversePickup(replacementRequest);
        replacementRequest.setPickupReference(trimToNull(pickupScheduleResult.pickupReference()));
        replacementRequest.setPickupStatus(trimToNull(pickupScheduleResult.pickupStatus()));
        if (pickupScheduleResult.scheduled()) {
            replacementRequest.setStatus(ReplacementStatus.PICKUP_SCHEDULED);
        }

        ReplacementRequest savedRequest = replacementRepository.save(replacementRequest);
        orderNotificationService.scheduleReplacementApproved(savedRequest.getId());
        if (savedRequest.getStatus() == ReplacementStatus.PICKUP_SCHEDULED) {
            orderNotificationService.scheduleReplacementPickupScheduled(savedRequest.getId());
        }
        return toResponse(savedRequest);
    }

    public ReplacementResponse rejectReplacement(Long replacementId, String adminNote) {
        ReplacementRequest replacementRequest = findReplacement(replacementId);
        if (replacementRequest.getStatus() != ReplacementStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only requested replacements can be rejected");
        }

        replacementRequest.setStatus(ReplacementStatus.REJECTED);
        replacementRequest.setAdminNote(trimToNull(adminNote));
        applyAdminReviewed(replacementRequest);
        ReplacementRequest savedRequest = replacementRepository.save(replacementRequest);
        orderNotificationService.scheduleReplacementRejected(savedRequest.getId());
        return toResponse(savedRequest);
    }

    public List<ReplacementResponse> bulkApprove(List<Long> replacementIds, String adminNote) {
        return replacementIds.stream()
            .distinct()
            .map(replacementId -> approveReplacement(replacementId, adminNote))
            .toList();
    }

    @Transactional(readOnly = true)
    public ReplacementRequest findReplacement(Long replacementId) {
        return replacementRepository.findById(replacementId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Replacement request not found"));
    }

    private ReplacementRequest findForUser(AppUser user, Long replacementId) {
        return replacementRepository.findByIdAndOrderUser(replacementId, user)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Replacement request not found"));
    }

    private ReplacementStatus parseStatus(String status) {
        try {
            return ReplacementStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid replacement status");
        }
    }

    private boolean evaluateFraud(AppUser user, Long productId, List<String> proofAssetUrls) {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<ReplacementRequest> recentRequests = replacementRepository.findByOrderUserAndRequestedAtAfter(user, thirtyDaysAgo);

        boolean tooManyRecentRequests = recentRequests.size() >= 3;
        boolean missingProofImage = proofAssetUrls == null || proofAssetUrls.isEmpty();
        boolean repeatedProduct = recentRequests.stream()
            .anyMatch(request -> productId.equals(request.getProductId()));

        return tooManyRecentRequests || missingProofImage || repeatedProduct;
    }

    private List<String> normalizeProofAssetUrls(ReplacementRequestDto requestDto) {
        List<String> proofAssetUrls = new ArrayList<>();

        if (StringUtils.hasText(requestDto.proofImageUrl())) {
            proofAssetUrls.add(requestDto.proofImageUrl().trim());
        }

        if (requestDto.proofAssetUrls() != null) {
            requestDto.proofAssetUrls().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(url -> !proofAssetUrls.contains(url))
                .forEach(proofAssetUrls::add);
        }

        return proofAssetUrls;
    }

    private String serializeProofAssetUrls(List<String> proofAssetUrls) {
        if (proofAssetUrls == null || proofAssetUrls.isEmpty()) {
            return null;
        }

        return String.join("\n", proofAssetUrls);
    }

    private List<String> resolveProofAssetUrls(ReplacementRequest replacementRequest) {
        if (StringUtils.hasText(replacementRequest.getProofAssetUrls())) {
            return replacementRequest.getProofAssetUrls().lines()
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        }

        if (StringUtils.hasText(replacementRequest.getProofImageUrl())) {
            return List.of(replacementRequest.getProofImageUrl().trim());
        }

        return List.of();
    }

    private OrderItem findOrderItem(CustomerOrder order, Long orderItemId) {
        return order.getItems().stream()
            .filter(item -> item.getId().equals(orderItemId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order item not found"));
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private void applyAdminReviewed(ReplacementRequest replacementRequest) {
        if (replacementRequest.getAdminReviewedAt() == null) {
            replacementRequest.setAdminReviewedAt(Instant.now());
        }
    }

    private ReplacementResponse toResponse(ReplacementRequest replacementRequest) {
        CustomerOrder order = replacementRequest.getOrder();
        List<String> proofAssetUrls = resolveProofAssetUrls(replacementRequest);
        return new ReplacementResponse(
            replacementRequest.getId(),
            order.getId(),
            replacementRequest.getOrderItemId(),
            replacementRequest.getProductId(),
            replacementRequest.getProductName(),
            replacementRequest.getProductImageUrl(),
            replacementRequest.getReason(),
            replacementRequest.getCustomerNote(),
            replacementRequest.getStatus().name(),
            replacementRequest.getRequestedAt(),
            replacementRequest.getApprovedAt(),
            replacementRequest.getAdminReviewedAt(),
            replacementRequest.getProofImageUrl(),
            proofAssetUrls,
            replacementRequest.getAdminNote(),
            replacementRequest.getIsFraudSuspected(),
            replacementRequest.getPickupReference(),
            replacementRequest.getPickupStatus(),
            order.getShippingName(),
            order.getContactEmail()
        );
    }
}
