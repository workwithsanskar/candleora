package com.candleora.controller;

import com.candleora.dto.admin.AdminOrderDetailResponse;
import com.candleora.dto.admin.AdminOrderTrackingUpdateRequest;
import com.candleora.dto.admin.AdminOrderStatusUpdateRequest;
import com.candleora.dto.admin.AdminOrderSummaryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.entity.CustomerOrder;
import com.candleora.service.AdminOrderService;
import com.candleora.service.InvoiceService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;
    private final InvoiceService invoiceService;

    public AdminOrderController(AdminOrderService adminOrderService, InvoiceService invoiceService) {
        this.adminOrderService = adminOrderService;
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public PagedResponse<AdminOrderSummaryResponse> getOrders(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) Boolean reviewed,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return adminOrderService.getOrders(search, status, startDate, endDate, reviewed, page, size);
    }

    @GetMapping("/{id}")
    public AdminOrderDetailResponse getOrder(@PathVariable Long id) {
        return adminOrderService.getOrder(id);
    }

    @GetMapping(value = "/{id}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) {
        CustomerOrder order = adminOrderService.getOrderEntity(id);
        byte[] pdf = invoiceService.generateInvoicePdf(order);

        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + invoiceService.buildInvoiceFilename(order) + "\""
            )
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }

    @PutMapping("/{id}/reviewed")
    public AdminOrderDetailResponse markReviewed(@PathVariable Long id) {
        return adminOrderService.markReviewed(id);
    }

    @PutMapping("/{id}/status")
    public AdminOrderDetailResponse updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody AdminOrderStatusUpdateRequest request
    ) {
        return adminOrderService.updateStatus(id, request);
    }

    @PutMapping("/{id}/tracking")
    public AdminOrderDetailResponse updateTracking(
        @PathVariable Long id,
        @Valid @RequestBody AdminOrderTrackingUpdateRequest request
    ) {
        return adminOrderService.updateTracking(id, request);
    }
}
