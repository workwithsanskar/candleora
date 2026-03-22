package com.candleora.service;

import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.dto.payment.CreateRazorpayOrderResponse;
import com.candleora.dto.payment.VerifyRazorpayPaymentRequest;
import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private static final String RAZORPAY_ORDERS_API = "https://api.razorpay.com/v1/orders";

    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;

    public PaymentService(
        OrderService orderService,
        ObjectMapper objectMapper,
        @Value("${app.razorpay.key-id:}") String razorpayKeyId,
        @Value("${app.razorpay.key-secret:}") String razorpayKeySecret
    ) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
    }

    public CreateRazorpayOrderResponse createRazorpayOrder(AppUser user, PlaceOrderRequest request) {
        ensureRazorpayConfigured();

        CustomerOrder order = orderService.createPendingOnlineOrder(user, request);
        long amountInSubunits = order.getTotalAmount()
            .multiply(BigDecimal.valueOf(100))
            .longValueExact();
        String gatewayOrderId = createGatewayOrder(order);
        CustomerOrder savedOrder = orderService.attachGatewayOrder(order, gatewayOrderId);

        return new CreateRazorpayOrderResponse(
            savedOrder.getId(),
            savedOrder.getGatewayOrderId(),
            amountInSubunits,
            "INR",
            razorpayKeyId,
            savedOrder.getShippingName(),
            savedOrder.getContactEmail(),
            savedOrder.getPhone()
        );
    }

    public OrderResponse verifyRazorpayPayment(AppUser user, VerifyRazorpayPaymentRequest request) {
        ensureRazorpayConfigured();
        CustomerOrder order = orderService.getOrderEntity(user, request.orderId());

        if (!request.razorpayOrderId().equals(order.getGatewayOrderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gateway order does not match");
        }

        if (!verifySignature(request.razorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature())) {
            orderService.markPaymentFailed(order);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Payment verification failed");
        }

        return orderService.finalizeOnlineOrder(
            user,
            request.orderId(),
            request.razorpayOrderId(),
            request.razorpayPaymentId(),
            request.razorpaySignature()
        );
    }

    private String createGatewayOrder(CustomerOrder order) {
        long amountInSubunits = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValueExact();

        try {
            String payload = objectMapper.writeValueAsString(new RazorpayOrderPayload(
                amountInSubunits,
                "INR",
                "candleora-" + order.getId()
            ));

            HttpRequest request = HttpRequest.newBuilder(URI.create(RAZORPAY_ORDERS_API))
                .header("Authorization", basicAuthHeader())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Razorpay order creation failed"
                );
            }

            JsonNode json = objectMapper.readTree(response.body());
            String gatewayOrderId = json.path("id").asText();
            if (!StringUtils.hasText(gatewayOrderId)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Razorpay response");
            }

            return gatewayOrderId;
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Razorpay integration is unavailable"
            );
        }
    }

    private boolean verifySignature(String gatewayOrderId, String paymentId, String signature) {
        try {
            String payload = gatewayOrderId + "|" + paymentId;
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = bytesToHex(digest);
            return expectedSignature.equals(signature);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment signature verification failed");
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private String basicAuthHeader() {
        String credentials = razorpayKeyId + ":" + razorpayKeySecret;
        return "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    private void ensureRazorpayConfigured() {
        if (!StringUtils.hasText(razorpayKeyId) || !StringUtils.hasText(razorpayKeySecret)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Razorpay is not configured on the server"
            );
        }
    }

    private record RazorpayOrderPayload(
        long amount,
        String currency,
        String receipt
    ) {
    }
}
