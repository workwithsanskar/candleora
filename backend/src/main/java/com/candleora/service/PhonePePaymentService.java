package com.candleora.service;

import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.dto.payment.CreatePhonePePaymentResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.PaymentProvider;
import com.candleora.entity.PaymentStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PhonePePaymentService {

    private static final String PHONEPE_PAY_PATH = "/pg/v1/pay";
    private static final String PHONEPE_STATUS_PATH_TEMPLATE = "/pg/v1/status/%s/%s";

    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String merchantId;
    private final String saltKey;
    private final String saltIndex;
    private final String baseUrl;
    private final String frontendUrl;
    private final String backendUrl;

    public PhonePePaymentService(
        OrderService orderService,
        ObjectMapper objectMapper,
        @Value("${app.phonepe.merchant-id:}") String merchantId,
        @Value("${app.phonepe.salt-key:}") String saltKey,
        @Value("${app.phonepe.salt-index:}") String saltIndex,
        @Value("${app.phonepe.base-url:https://api-preprod.phonepe.com/apis/pg-sandbox}") String baseUrl,
        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
        @Value("${app.backend-url:http://localhost:8080}") String backendUrl
    ) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.merchantId = merchantId;
        this.saltKey = saltKey;
        this.saltIndex = saltIndex;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.frontendUrl = trimTrailingSlash(frontendUrl);
        this.backendUrl = trimTrailingSlash(backendUrl);
    }

    public CreatePhonePePaymentResponse createCheckoutSession(AppUser user, PlaceOrderRequest request) {
        ensureConfigured();

        CustomerOrder order = orderService.createPendingOnlineOrder(user, request, PaymentProvider.PHONEPE);
        String merchantTransactionId = buildMerchantTransactionId(order.getId());
        CustomerOrder savedOrder = orderService.attachGatewayOrder(order, merchantTransactionId);
        String checkoutUrl = createPaymentUrl(savedOrder);

        return new CreatePhonePePaymentResponse(
            savedOrder.getId(),
            merchantTransactionId,
            checkoutUrl
        );
    }

    public OrderResponse fetchPaymentStatus(AppUser user, Long orderId) {
        ensureConfigured();

        CustomerOrder order = orderService.getOrderEntity(user, orderId);
        if (order.getPaymentProvider() != PaymentProvider.PHONEPE) {
            return orderService.getOrder(user, orderId);
        }

        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.FAILED) {
            return orderService.getOrder(user, orderId);
        }

        if (!StringUtils.hasText(order.getGatewayOrderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PhonePe transaction is missing");
        }

        JsonNode statusResponse = invokeStatusApi(order.getGatewayOrderId());
        if (isPaymentSuccessful(statusResponse)) {
            String providerTransactionId = firstNonBlank(
                statusResponse.path("data").path("transactionId").asText(),
                statusResponse.path("data").path("providerReferenceId").asText(),
                statusResponse.path("data").path("paymentInstrument").path("transactionId").asText()
            );

            return orderService.finalizeOnlineOrder(
                user,
                orderId,
                order.getGatewayOrderId(),
                providerTransactionId,
                firstNonBlank(
                    statusResponse.path("code").asText(),
                    statusResponse.path("data").path("responseCode").asText()
                )
            );
        }

        if (isPaymentFailed(statusResponse)) {
            orderService.markPaymentFailed(order);
        }

        return orderService.getOrder(user, orderId);
    }

    private String createPaymentUrl(CustomerOrder order) {
        try {
            String redirectUrl = frontendUrl + "/checkout/phonepe-return?orderId=" + order.getId();
            String callbackUrl = backendUrl + "/api/payments/phonepe/callback?orderId=" + order.getId();

            PhonePePayRequest payload = new PhonePePayRequest(
                merchantId,
                order.getGatewayOrderId(),
                "USER-" + order.getUser().getId(),
                order.getTotalAmount().movePointRight(2).longValueExact(),
                redirectUrl,
                "REDIRECT",
                callbackUrl,
                sanitizePhone(order.getPhone()),
                Map.of("type", "PAY_PAGE")
            );

            String payloadJson = objectMapper.writeValueAsString(payload);
            String base64Payload = Base64.getEncoder()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            String signature = sha256Hex(base64Payload + PHONEPE_PAY_PATH + saltKey) + "###" + saltIndex;

            String requestBody = objectMapper.writeValueAsString(Map.of("request", base64Payload));
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + PHONEPE_PAY_PATH))
                .header("Content-Type", "application/json")
                .header("X-VERIFY", signature)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe payment session could not be created");
            }

            JsonNode json = objectMapper.readTree(response.body());
            String checkoutUrl = firstNonBlank(
                json.path("data").path("instrumentResponse").path("redirectInfo").path("url").asText(),
                json.path("data").path("redirectUrl").asText(),
                json.path("redirectUrl").asText()
            );

            if (!StringUtils.hasText(checkoutUrl)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe did not return a checkout URL");
            }

            return checkoutUrl;
        } catch (IOException ioException) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe payment session could not be created");
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe integration is unavailable");
        }
    }

    private JsonNode invokeStatusApi(String merchantTransactionId) {
        String path = String.format(PHONEPE_STATUS_PATH_TEMPLATE, merchantId, merchantTransactionId);
        String signature = sha256Hex(path + saltKey) + "###" + saltIndex;

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + path))
                .header("Content-Type", "application/json")
                .header("X-VERIFY", signature)
                .header("X-MERCHANT-ID", merchantId)
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe payment status could not be fetched");
            }

            return objectMapper.readTree(response.body());
        } catch (IOException ioException) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe payment status could not be read");
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe integration is unavailable");
        }
    }

    private boolean isPaymentSuccessful(JsonNode statusResponse) {
        String code = firstNonBlank(
            statusResponse.path("code").asText(),
            statusResponse.path("data").path("responseCode").asText(),
            statusResponse.path("data").path("state").asText()
        ).toUpperCase();

        return code.contains("SUCCESS") || code.contains("COMPLETED");
    }

    private boolean isPaymentFailed(JsonNode statusResponse) {
        String code = firstNonBlank(
            statusResponse.path("code").asText(),
            statusResponse.path("data").path("responseCode").asText(),
            statusResponse.path("data").path("state").asText()
        ).toUpperCase();

        return code.contains("FAILED") || code.contains("ERROR") || code.contains("DECLINED");
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(merchantId) || !StringUtils.hasText(saltKey) || !StringUtils.hasText(saltIndex)) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PhonePe is not configured on the server"
            );
        }
    }

    private String buildMerchantTransactionId(Long orderId) {
        return "CANDLEORA-" + orderId + "-" + Instant.now().toEpochMilli();
    }

    private String sanitizePhone(String value) {
        String normalized = String.valueOf(value == null ? "" : value).replaceAll("\\D", "");
        if (normalized.length() > 10) {
            return normalized.substring(normalized.length() - 10);
        }

        return normalized;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PhonePe signature generation failed");
        }
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        return "";
    }

    private record PhonePePayRequest(
        String merchantId,
        String merchantTransactionId,
        String merchantUserId,
        long amount,
        String redirectUrl,
        String redirectMode,
        String callbackUrl,
        String mobileNumber,
        Map<String, String> paymentInstrument
    ) {
    }
}
