package com.candleora.controller;

import com.candleora.dto.admin.AdminInventoryAdjustmentRequest;
import com.candleora.dto.admin.AdminInventoryMovementResponse;
import com.candleora.dto.admin.AdminProductRequest;
import com.candleora.dto.admin.AdminProductResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.service.InventoryService;
import com.candleora.service.AdminProductService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminProductService adminProductService;
    private final InventoryService inventoryService;

    public AdminProductController(
        AdminProductService adminProductService,
        InventoryService inventoryService
    ) {
        this.adminProductService = adminProductService;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public PagedResponse<AdminProductResponse> getProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String stock,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return adminProductService.getProducts(search, category, stock, page, size);
    }

    @PostMapping
    public AdminProductResponse createProduct(@Valid @RequestBody AdminProductRequest request) {
        return adminProductService.createProduct(request);
    }

    @PutMapping("/{id}")
    public AdminProductResponse updateProduct(
        @PathVariable Long id,
        @Valid @RequestBody AdminProductRequest request
    ) {
        return adminProductService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        adminProductService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/inventory-history")
    public List<AdminInventoryMovementResponse> getInventoryHistory(@PathVariable Long id) {
        return inventoryService.getInventoryHistory(id);
    }

    @PostMapping("/{id}/inventory-adjustments")
    public AdminInventoryMovementResponse adjustInventory(
        @PathVariable Long id,
        @Valid @RequestBody AdminInventoryAdjustmentRequest request
    ) {
        return inventoryService.adjustOnHandStock(id, request.adjustment(), request.note());
    }
}
