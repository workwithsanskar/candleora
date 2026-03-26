package com.candleora.service;

import com.candleora.entity.CustomerOrder;
import com.candleora.repository.CustomerOrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.task.TaskExecutor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class OrderNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(OrderNotificationService.class);

    private final CustomerOrderRepository customerOrderRepository;
    private final InvoiceService invoiceService;
    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender;
    private final TaskExecutor taskExecutor;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String mailHost;
    private final String fromEmail;
    private final String supportEmail;
    private final String companyName;
    private final String frontendUrl;
    private final String resendApiKey;
    private final String resendBaseUrl;

    public OrderNotificationService(
        CustomerOrderRepository customerOrderRepository,
        InvoiceService invoiceService,
        TemplateEngine templateEngine,
        ObjectProvider<JavaMailSender> mailSenderProvider,
        ObjectMapper objectMapper,
        @Qualifier("appTaskExecutor") TaskExecutor taskExecutor,
        @Value("${spring.mail.host:}") String mailHost,
        @Value("${app.invoice.from-email:no-reply@candleora.com}") String fromEmail,
        @Value("${app.invoice.support-email:support@candleora.com}") String supportEmail,
        @Value("${app.invoice.company-name:CandleOra}") String companyName,
        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
        @Value("${app.email.resend-api-key:}") String resendApiKey,
        @Value("${app.email.resend-base-url:https://api.resend.com}") String resendBaseUrl
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.invoiceService = invoiceService;
        this.templateEngine = templateEngine;
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.objectMapper = objectMapper;
        this.taskExecutor = taskExecutor;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
        this.mailHost = mailHost;
        this.fromEmail = fromEmail;
        this.supportEmail = supportEmail;
        this.companyName = companyName;
        this.frontendUrl = frontendUrl;
        this.resendApiKey = resendApiKey;
        this.resendBaseUrl = resendBaseUrl;
    }

    public void scheduleOrderConfirmation(Long orderId) {
        Runnable trigger = () -> taskExecutor.execute(() -> sendOrderConfirmation(orderId));

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    trigger.run();
                }
            });
            return;
        }

        trigger.run();
    }

    private void sendOrderConfirmation(Long orderId) {
        try {
            CustomerOrder order = customerOrderRepository.findById(orderId).orElse(null);
            if (order == null || !invoiceService.isInvoiceAvailable(order)) {
                return;
            }

            if (!StringUtils.hasText(order.getContactEmail())) {
                logger.info("Skipping order confirmation email because no contact email exists for order {}", orderId);
                return;
            }

            byte[] invoicePdf = invoiceService.generateInvoicePdf(order);
            String emailHtml = buildEmailHtml(order);

            if (StringUtils.hasText(resendApiKey)) {
                sendWithResend(order, emailHtml, invoicePdf);
                return;
            }

            if (StringUtils.hasText(mailHost) && mailSender != null) {
                sendWithSmtp(order, emailHtml, invoicePdf);
                return;
            }

            logger.info("Skipping order confirmation email because neither Resend nor Spring Mail is configured");
        } catch (Exception exception) {
            logger.warn("Unable to send order confirmation email", exception);
        }
    }

    private String buildEmailHtml(CustomerOrder order) {
        Context context = new Context(Locale.ENGLISH);
        context.setVariable("companyName", companyName);
        context.setVariable("customerName", defaultText(order.getShippingName(), "there"));
        context.setVariable("orderId", order.getId());
        context.setVariable("invoiceNumber", invoiceService.buildInvoiceNumber(order));
        context.setVariable("totalAmount", invoiceService.formatMoney(order.getTotalAmount()));
        context.setVariable(
            "paymentStatus",
            order.getPaymentStatus().name().replace('_', ' ').toLowerCase(Locale.ENGLISH)
        );
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("orderUrl", frontendUrl + "/orders/" + order.getId());
        return templateEngine.process("email/order-confirmation", context);
    }

    private void sendWithSmtp(CustomerOrder order, String emailHtml, byte[] invoicePdf) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
            message,
            true,
            StandardCharsets.UTF_8.name()
        );
        helper.setTo(order.getContactEmail());
        helper.setFrom(fromEmail);
        helper.setSubject("Your CandleOra order confirmation");
        helper.setText(emailHtml, true);
        helper.addAttachment(
            invoiceService.buildInvoiceFilename(order),
            new ByteArrayResource(invoicePdf)
        );
        mailSender.send(message);
    }

    private void sendWithResend(CustomerOrder order, String emailHtml, byte[] invoicePdf)
        throws IOException, InterruptedException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", fromEmail);
        payload.put("to", new String[] { order.getContactEmail() });
        payload.put("subject", "Your CandleOra order confirmation");
        payload.put("html", emailHtml);
        payload.put("reply_to", supportEmail);
        payload.put(
            "attachments",
            new Object[] {
                Map.of(
                    "filename",
                    invoiceService.buildInvoiceFilename(order),
                    "content",
                    Base64.getEncoder().encodeToString(invoicePdf)
                ),
            }
        );

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(trimTrailingSlash(resendBaseUrl) + "/emails"))
            .timeout(Duration.ofSeconds(30))
            .header("Authorization", "Bearer " + resendApiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException(
                "Resend request failed with status " + response.statusCode() + ": " + response.body()
            );
        }
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
