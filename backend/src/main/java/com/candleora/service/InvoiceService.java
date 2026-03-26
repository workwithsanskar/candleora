package com.candleora.service;

import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.PaymentStatus;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service("invoiceService")
public class InvoiceService {

    private static final ZoneId INDIA_ZONE = ZoneId.of("Asia/Calcutta");
    private static final DateTimeFormatter INVOICE_DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy")
        .withLocale(Locale.ENGLISH)
        .withZone(INDIA_ZONE);
    private static final DateTimeFormatter INVOICE_NUMBER_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd")
        .withLocale(Locale.ENGLISH)
        .withZone(INDIA_ZONE);

    private final TemplateEngine templateEngine;
    private final String companyName;
    private final String supportEmail;

    public InvoiceService(
        TemplateEngine templateEngine,
        @Value("${app.invoice.company-name:CandleOra}") String companyName,
        @Value("${app.invoice.support-email:support@candleora.com}") String supportEmail
    ) {
        this.templateEngine = templateEngine;
        this.companyName = companyName;
        this.supportEmail = supportEmail;
    }

    public boolean isInvoiceAvailable(CustomerOrder order) {
        return order != null &&
            order.getStatus() != OrderStatus.PENDING_PAYMENT &&
            order.getPaymentStatus() != PaymentStatus.PENDING &&
            order.getPaymentStatus() != PaymentStatus.FAILED;
    }

    public String buildInvoiceNumber(CustomerOrder order) {
        if (order == null || order.getId() == null || order.getCreatedAt() == null) {
            return null;
        }

        return "CNDL-" +
            INVOICE_NUMBER_DATE_FORMAT.format(order.getCreatedAt()) +
            "-" +
            String.format(Locale.ENGLISH, "%06d", order.getId());
    }

    public String buildInvoiceFilename(CustomerOrder order) {
        return buildInvoiceNumber(order) + ".pdf";
    }

    public byte[] generateInvoicePdf(CustomerOrder order) {
        if (!isInvoiceAvailable(order)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Invoice is available only after the order is confirmed"
            );
        }

        Context context = new Context(Locale.ENGLISH);
        context.setVariable("companyName", companyName);
        context.setVariable("supportEmail", supportEmail);
        context.setVariable("invoiceNumber", buildInvoiceNumber(order));
        context.setVariable("issuedDate", INVOICE_DATE_FORMAT.format(order.getCreatedAt()));
        context.setVariable("orderId", order.getId());
        context.setVariable("paymentMethod", order.getPaymentMethod());
        context.setVariable("paymentStatus", humanize(order.getPaymentStatus().name()));
        context.setVariable("customerName", order.getShippingName());
        context.setVariable("customerEmail", order.getContactEmail());
        context.setVariable("customerPhone", order.getPhone());
        context.setVariable("shippingAddress", formatAddress(order));
        context.setVariable("items", order.getItems());
        context.setVariable("subtotal", formatMoney(order.getTotalAmount()));
        context.setVariable("grandTotal", formatMoney(order.getTotalAmount()));

        String html = templateEngine.process("invoice/order-invoice", context);
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        try {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, "");
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unable to generate invoice PDF",
                exception
            );
        }
    }

    public String formatMoney(BigDecimal amount) {
        BigDecimal normalized = amount == null
            ? BigDecimal.ZERO
            : amount.setScale(2, RoundingMode.HALF_UP);
        return "Rs. " + normalized.toPlainString();
    }

    public String lineTotal(OrderItem item) {
        return formatMoney(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
    }

    public String formatAddress(CustomerOrder order) {
        List<String> parts = Stream.of(
            order.getAddressLine1(),
            order.getAddressLine2(),
            order.getCity(),
            order.getState(),
            order.getPostalCode(),
            order.getCountry()
        ).filter(value -> value != null && !value.isBlank()).toList();

        return String.join(", ", parts);
    }

    private String humanize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value.replace('_', ' ').toLowerCase(Locale.ENGLISH);
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }
}
