package com.candleora.controller;

import com.candleora.dto.order.CancelOrderRequest;
import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.entity.CustomerOrder;
import com.candleora.security.UserPrincipal;
import com.candleora.service.InvoiceService;
import com.candleora.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;

    public OrderController(OrderService orderService, InvoiceService invoiceService) {
        this.orderService = orderService;
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public OrderResponse placeOrder(
        Authentication authentication,
        @Valid @RequestBody PlaceOrderRequest request
    ) {
        return orderService.placeOrder(((UserPrincipal) authentication.getPrincipal()).getUser(), request);
    }

    @GetMapping
    public List<OrderResponse> getOrderHistory(Authentication authentication) {
        return orderService.getOrders(((UserPrincipal) authentication.getPrincipal()).getUser());
    }

    @GetMapping("/me")
    public List<OrderResponse> getOrders(Authentication authentication) {
        return orderService.getOrders(((UserPrincipal) authentication.getPrincipal()).getUser());
    }

    @GetMapping("/{orderId}")
    public OrderResponse getOrder(Authentication authentication, @PathVariable Long orderId) {
        return orderService.getOrder(((UserPrincipal) authentication.getPrincipal()).getUser(), orderId);
    }

    @GetMapping("/{orderId}/tracking")
    public OrderResponse getTrackedOrder(@PathVariable Long orderId, @RequestParam("email") String email) {
        return orderService.getOrderForTracking(orderId, email);
    }

    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancelOrder(
        Authentication authentication,
        @PathVariable Long orderId,
        @RequestBody(required = false) CancelOrderRequest request
    ) {
        String reason = request != null ? request.reason() : null;
        return orderService.cancelOrder(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            orderId,
            reason
        );
    }

    @GetMapping(value = "/{orderId}/invoice", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadInvoice(Authentication authentication, @PathVariable Long orderId) {
        CustomerOrder order = orderService.getOrderEntity(
            ((UserPrincipal) authentication.getPrincipal()).getUser(),
            orderId
        );
        return buildInvoiceResponse(order);
    }

    @GetMapping(value = "/{orderId}/invoice/tracking", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadTrackedInvoice(
        @PathVariable Long orderId,
        @RequestParam("email") String email
    ) {
        CustomerOrder order = orderService.getOrderEntityForTracking(orderId, email);
        return buildInvoiceResponse(order);
    }

    private ResponseEntity<byte[]> buildInvoiceResponse(CustomerOrder order) {
        byte[] pdf = invoiceService.generateInvoicePdf(order);

        return ResponseEntity.ok()
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + invoiceService.buildInvoiceFilename(order) + "\""
            )
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }
}
