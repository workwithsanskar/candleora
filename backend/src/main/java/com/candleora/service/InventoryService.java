package com.candleora.service;

import com.candleora.dto.admin.AdminInventoryMovementResponse;
import com.candleora.entity.InventoryMovementType;
import com.candleora.entity.Product;
import com.candleora.entity.ProductInventoryMovement;
import com.candleora.repository.ProductInventoryMovementRepository;
import com.candleora.repository.ProductRepository;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class InventoryService {

    private final ProductRepository productRepository;
    private final ProductInventoryMovementRepository movementRepository;

    public InventoryService(
        ProductRepository productRepository,
        ProductInventoryMovementRepository movementRepository
    ) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminInventoryMovementResponse> getInventoryHistory(Long productId) {
        return movementRepository.findTop25ByProductIdOrderByCreatedAtDescIdDesc(productId).stream()
            .map(this::toMovementResponse)
            .toList();
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public AdminInventoryMovementResponse adjustOnHandStock(Long productId, int adjustment, String note) {
        if (adjustment == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adjustment cannot be zero");
        }

        Product product = findProduct(productId);
        int currentStock = safeOnHand(product);
        int currentReserved = safeReserved(product);
        int nextStock = currentStock + adjustment;

        if (nextStock < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "On-hand stock cannot go below zero");
        }

        if (nextStock < currentReserved) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "On-hand stock cannot be reduced below the currently reserved units"
            );
        }

        product.setStock(nextStock);
        productRepository.save(product);

        ProductInventoryMovement movement = createMovement(
            product,
            InventoryMovementType.MANUAL_ADJUSTMENT,
            adjustment,
            0,
            null,
            null,
            note
        );
        return toMovementResponse(movementRepository.save(movement));
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void reserveForPendingOrder(Product product, int quantity, Long orderId) {
        validateAvailableStock(product, quantity);
        int nextReserved = safeReserved(product) + quantity;
        product.setReservedStock(nextReserved);
        productRepository.save(product);
        logMovement(product, InventoryMovementType.RESERVATION_CREATED, 0, quantity, "ORDER", orderId, "Reserved for pending payment");
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void releasePendingReservation(Product product, int quantity, Long orderId, String note) {
        int currentReserved = safeReserved(product);
        int released = Math.min(quantity, currentReserved);
        if (released <= 0) {
            return;
        }

        product.setReservedStock(currentReserved - released);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.RESERVATION_RELEASED,
            0,
            -released,
            "ORDER",
            orderId,
            note
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void commitDirectSale(Product product, int quantity, Long orderId) {
        validateAvailableStock(product, quantity);
        product.setStock(safeOnHand(product) - quantity);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.DIRECT_SALE_COMMITTED,
            -quantity,
            0,
            "ORDER",
            orderId,
            "Committed stock for direct confirmed order"
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void commitReservedOrder(Product product, int quantity, Long orderId) {
        int currentReserved = safeReserved(product);
        int currentStock = safeOnHand(product);

        if (currentStock < quantity) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "On-hand stock is no longer sufficient for " + product.getName()
            );
        }

        int reservedDelta = 0;
        if (currentReserved > 0) {
            int consumedReserved = Math.min(quantity, currentReserved);
            product.setReservedStock(currentReserved - consumedReserved);
            reservedDelta = -consumedReserved;
        }

        product.setStock(currentStock - quantity);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.ORDER_COMMITTED,
            -quantity,
            reservedDelta,
            "ORDER",
            orderId,
            currentReserved >= quantity
                ? "Committed reserved stock after payment confirmation"
                : "Committed stock after payment confirmation"
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void restockFromCancelledOrder(Product product, int quantity, Long orderId) {
        product.setStock(safeOnHand(product) + quantity);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.ORDER_RESTOCKED,
            quantity,
            0,
            "ORDER",
            orderId,
            "Restocked after order cancellation"
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void reserveForReplacement(Product product, int quantity, Long replacementRequestId) {
        validateAvailableStock(product, quantity);
        product.setReservedStock(safeReserved(product) + quantity);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.REPLACEMENT_RESERVED,
            0,
            quantity,
            "REPLACEMENT",
            replacementRequestId,
            "Reserved stock for approved replacement"
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void releaseReplacementReservation(Product product, int quantity, Long replacementRequestId, String note) {
        int currentReserved = safeReserved(product);
        int released = Math.min(quantity, currentReserved);
        if (released <= 0) {
            return;
        }

        product.setReservedStock(currentReserved - released);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.REPLACEMENT_RELEASED,
            0,
            -released,
            "REPLACEMENT",
            replacementRequestId,
            note
        );
    }

    @CacheEvict(
        cacheNames = {"catalogProductPages", "catalogProductDetail", "catalogRelatedProducts"},
        allEntries = true
    )
    public void commitReplacement(Product product, int quantity, Long replacementRequestId) {
        int currentReserved = safeReserved(product);
        int currentStock = safeOnHand(product);

        if (currentStock < quantity) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "On-hand stock is no longer sufficient for " + product.getName()
            );
        }

        int reservedDelta = 0;
        if (currentReserved > 0) {
            int consumedReserved = Math.min(quantity, currentReserved);
            product.setReservedStock(currentReserved - consumedReserved);
            reservedDelta = -consumedReserved;
        }

        product.setStock(currentStock - quantity);
        productRepository.save(product);
        logMovement(
            product,
            InventoryMovementType.REPLACEMENT_COMMITTED,
            -quantity,
            reservedDelta,
            "REPLACEMENT",
            replacementRequestId,
            "Committed stock for shipped replacement"
        );
    }

    public void validateAvailableStock(Product product, int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero");
        }

        if (product.getAvailableStock() < quantity) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Insufficient available stock for " + product.getName()
            );
        }
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private int safeOnHand(Product product) {
        return product.getStock() == null ? 0 : product.getStock();
    }

    private int safeReserved(Product product) {
        return product.getReservedStock() == null ? 0 : product.getReservedStock();
    }

    private void logMovement(
        Product product,
        InventoryMovementType type,
        int onHandDelta,
        int reservedDelta,
        String referenceType,
        Long referenceId,
        String note
    ) {
        movementRepository.save(createMovement(product, type, onHandDelta, reservedDelta, referenceType, referenceId, note));
    }

    private ProductInventoryMovement createMovement(
        Product product,
        InventoryMovementType type,
        int onHandDelta,
        int reservedDelta,
        String referenceType,
        Long referenceId,
        String note
    ) {
        ProductInventoryMovement movement = new ProductInventoryMovement();
        movement.setProduct(product);
        movement.setType(type);
        movement.setOnHandDelta(onHandDelta);
        movement.setReservedDelta(reservedDelta);
        movement.setOnHandAfter(safeOnHand(product));
        movement.setReservedAfter(safeReserved(product));
        movement.setAvailableAfter(product.getAvailableStock());
        movement.setReferenceType(referenceType);
        movement.setReferenceId(referenceId);
        movement.setNote(StringUtils.hasText(note) ? note.trim() : null);
        return movement;
    }

    private AdminInventoryMovementResponse toMovementResponse(ProductInventoryMovement movement) {
        return new AdminInventoryMovementResponse(
            movement.getId(),
            movement.getType().name(),
            movement.getOnHandDelta(),
            movement.getReservedDelta(),
            movement.getOnHandAfter(),
            movement.getReservedAfter(),
            movement.getAvailableAfter(),
            movement.getReferenceType(),
            movement.getReferenceId(),
            movement.getNote(),
            movement.getCreatedAt()
        );
    }
}
