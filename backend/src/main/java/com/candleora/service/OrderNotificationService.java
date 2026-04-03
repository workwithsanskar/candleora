package com.candleora.service;

import com.candleora.entity.CustomerOrder;
import com.candleora.entity.ReplacementRequest;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ReplacementRepository;
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
    private final ReplacementRepository replacementRepository;
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
        ReplacementRepository replacementRepository,
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
        this.replacementRepository = replacementRepository;
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

        scheduleAfterCommit(trigger);
    }

    public void scheduleReplacementSubmitted(Long replacementId) {
        scheduleAfterCommit(() -> taskExecutor.execute(() -> sendReplacementNotification(
            replacementId,
            "Your CandleOra replacement request is in review",
            "Replacement request received",
            "We have logged your request and the support team is reviewing the item details you shared."
        )));
    }

    public void scheduleReplacementApproved(Long replacementId) {
        scheduleAfterCommit(() -> taskExecutor.execute(() -> sendReplacementNotification(
            replacementId,
            "Your CandleOra replacement has been approved",
            "Replacement approved",
            "Your replacement request has been approved and we are preparing the next fulfilment step."
        )));
    }

    public void scheduleReplacementRejected(Long replacementId) {
        scheduleAfterCommit(() -> taskExecutor.execute(() -> sendReplacementNotification(
            replacementId,
            "Update on your CandleOra replacement request",
            "Replacement request updated",
            "Your replacement request has been reviewed and marked as rejected. Check the admin note for the latest context."
        )));
    }

    public void scheduleReplacementPickupScheduled(Long replacementId) {
        scheduleAfterCommit(() -> taskExecutor.execute(() -> sendReplacementNotification(
            replacementId,
            "Your CandleOra reverse pickup is being arranged",
            "Pickup status updated",
            "We have moved your replacement into the pickup stage and will keep you updated as the courier flow progresses."
        )));
    }

    public void scheduleReplacementShipped(Long replacementId) {
        scheduleAfterCommit(() -> taskExecutor.execute(() -> sendReplacementNotification(
            replacementId,
            "Your CandleOra replacement is on the way",
            "Replacement shipped",
            "Your replacement order is now moving through fulfilment and will appear in your order history shortly."
        )));
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
            sendEmail(
                order.getContactEmail(),
                "Your CandleOra order confirmation",
                emailHtml,
                invoiceService.buildInvoiceFilename(order),
                invoicePdf
            );
        } catch (Exception exception) {
            logger.warn("Unable to send order confirmation email", exception);
        }
    }

    private void sendReplacementNotification(
        Long replacementId,
        String subject,
        String heading,
        String bodyCopy
    ) {
        try {
            ReplacementRequest replacement = replacementRepository.findById(replacementId).orElse(null);
            if (replacement == null || replacement.getOrder() == null) {
                return;
            }

            CustomerOrder order = replacement.getOrder();
            if (!StringUtils.hasText(order.getContactEmail())) {
                logger.info(
                    "Skipping replacement email because no contact email exists for replacement {}",
                    replacementId
                );
                return;
            }

            sendEmail(
                order.getContactEmail(),
                subject,
                buildReplacementEmailHtml(order, replacement, heading, bodyCopy),
                null,
                null
            );
        } catch (Exception exception) {
            logger.warn("Unable to send replacement notification", exception);
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

    private String buildReplacementEmailHtml(
        CustomerOrder order,
        ReplacementRequest replacement,
        String heading,
        String bodyCopy
    ) {
        String orderUrl = frontendUrl + "/orders/" + order.getId();
        String adminNote = StringUtils.hasText(replacement.getAdminNote())
            ? "<p style=\"margin:16px 0 0;color:#3a3028;font-size:14px;line-height:1.7;\"><strong>Admin note:</strong> "
                + replacement.getAdminNote()
                + "</p>"
            : "";

        String pickupCopy = StringUtils.hasText(replacement.getPickupStatus())
            ? "<p style=\"margin:12px 0 0;color:#6b6b6b;font-size:14px;line-height:1.7;\">Pickup status: "
                + replacement.getPickupStatus()
                + "</p>"
            : "";

        return """
            <html>
              <body style="margin:0;background:#fbf7f0;font-family:Poppins,Segoe UI,sans-serif;color:#17120f;">
                <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
                  <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.08);border-radius:28px;padding:32px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#a56a00;">%s</p>
                    <h1 style="margin:0;font-size:32px;line-height:1.08;">%s</h1>
                    <p style="margin:18px 0 0;color:#6b6b6b;font-size:15px;line-height:1.8;">Hello %s, %s</p>
                    <div style="margin-top:24px;padding:18px 20px;border-radius:22px;background:#fff7e8;border:1px solid rgba(241,184,90,0.38);">
                      <p style="margin:0;font-size:14px;line-height:1.8;"><strong>Order:</strong> #%s</p>
                      <p style="margin:8px 0 0;font-size:14px;line-height:1.8;"><strong>Replacement:</strong> #%s</p>
                      <p style="margin:8px 0 0;font-size:14px;line-height:1.8;"><strong>Item:</strong> %s</p>
                      <p style="margin:8px 0 0;font-size:14px;line-height:1.8;"><strong>Status:</strong> %s</p>
                      %s
                      %s
                    </div>
                    <p style="margin:24px 0 0;"><a href="%s" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffa20a;color:#17120f;font-weight:700;text-decoration:none;">View order</a></p>
                  </div>
                </div>
              </body>
            </html>
            """.formatted(
            companyName,
            heading,
            defaultText(order.getShippingName(), "there"),
            bodyCopy,
            order.getId(),
            replacement.getId(),
            defaultText(replacement.getProductName(), "Ordered item"),
            replacement.getStatus().name().replace('_', ' ').toLowerCase(Locale.ENGLISH),
            adminNote,
            pickupCopy,
            orderUrl
        );
    }

    private void sendWithSmtp(
        String toEmail,
        String subject,
        String emailHtml,
        String attachmentFilename,
        byte[] attachmentBytes
    ) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
            message,
            true,
            StandardCharsets.UTF_8.name()
        );
        helper.setTo(toEmail);
        helper.setFrom(fromEmail);
        helper.setSubject(subject);
        helper.setText(emailHtml, true);
        if (attachmentBytes != null && attachmentFilename != null) {
            helper.addAttachment(attachmentFilename, new ByteArrayResource(attachmentBytes));
        }
        mailSender.send(message);
    }

    private void sendWithResend(
        String toEmail,
        String subject,
        String emailHtml,
        String attachmentFilename,
        byte[] attachmentBytes
    )
        throws IOException, InterruptedException {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("from", fromEmail);
        payload.put("to", new String[] { toEmail });
        payload.put("subject", subject);
        payload.put("html", emailHtml);
        payload.put("reply_to", supportEmail);
        if (attachmentBytes != null && attachmentFilename != null) {
            payload.put(
                "attachments",
                new Object[] {
                    Map.of(
                        "filename",
                        attachmentFilename,
                        "content",
                        Base64.getEncoder().encodeToString(attachmentBytes)
                    ),
                }
            );
        }

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

    private void sendEmail(
        String toEmail,
        String subject,
        String emailHtml,
        String attachmentFilename,
        byte[] attachmentBytes
    ) throws Exception {
        if (StringUtils.hasText(resendApiKey)) {
            sendWithResend(toEmail, subject, emailHtml, attachmentFilename, attachmentBytes);
            return;
        }

        if (StringUtils.hasText(mailHost) && mailSender != null) {
            sendWithSmtp(toEmail, subject, emailHtml, attachmentFilename, attachmentBytes);
            return;
        }

        logger.info("Skipping transactional email because neither Resend nor Spring Mail is configured");
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private void scheduleAfterCommit(Runnable trigger) {
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

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }

        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
