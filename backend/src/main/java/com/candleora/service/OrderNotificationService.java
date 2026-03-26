package com.candleora.service;

import com.candleora.entity.CustomerOrder;
import com.candleora.repository.CustomerOrderRepository;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private final String mailHost;
    private final String fromEmail;
    private final String supportEmail;
    private final String companyName;
    private final String frontendUrl;

    public OrderNotificationService(
        CustomerOrderRepository customerOrderRepository,
        InvoiceService invoiceService,
        TemplateEngine templateEngine,
        JavaMailSender mailSender,
        @Qualifier("appTaskExecutor") TaskExecutor taskExecutor,
        @Value("${spring.mail.host:}") String mailHost,
        @Value("${app.invoice.from-email:no-reply@candleora.com}") String fromEmail,
        @Value("${app.invoice.support-email:support@candleora.com}") String supportEmail,
        @Value("${app.invoice.company-name:CandleOra}") String companyName,
        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.invoiceService = invoiceService;
        this.templateEngine = templateEngine;
        this.mailSender = mailSender;
        this.taskExecutor = taskExecutor;
        this.mailHost = mailHost;
        this.fromEmail = fromEmail;
        this.supportEmail = supportEmail;
        this.companyName = companyName;
        this.frontendUrl = frontendUrl;
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

            if (!StringUtils.hasText(mailHost)) {
                logger.info("Skipping order confirmation email because Spring Mail is not configured");
                return;
            }

            byte[] invoicePdf = invoiceService.generateInvoicePdf(order);
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
            String emailHtml = templateEngine.process("email/order-confirmation", context);

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
        } catch (Exception exception) {
            logger.warn("Unable to send order confirmation email", exception);
        }
    }

    private String defaultText(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
