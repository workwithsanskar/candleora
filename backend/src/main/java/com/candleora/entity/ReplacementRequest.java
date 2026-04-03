package com.candleora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Lob;
import java.time.Instant;

@Entity
@Table(name = "replacement_requests")
public class ReplacementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @Column(nullable = false)
    private Long orderItemId;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(length = 1024)
    private String productImageUrl;

    @Column(nullable = false, length = 200)
    private String reason;

    @Column(length = 1000)
    private String customerNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReplacementStatus status = ReplacementStatus.REQUESTED;

    @Column(nullable = false)
    private Instant requestedAt;

    @Column
    private Instant approvedAt;

    @Column(length = 2048)
    private String proofImageUrl;

    @Lob
    @Column(name = "proof_asset_urls")
    private String proofAssetUrls;

    @Column(length = 1000)
    private String adminNote;

    @Column(nullable = false)
    private Boolean isFraudSuspected = false;

    @Column(length = 255)
    private String pickupReference;

    @Column(length = 128)
    private String pickupStatus;

    @Column
    private Instant adminReviewedAt;

    @PrePersist
    void onCreate() {
        if (requestedAt == null) {
            requestedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public CustomerOrder getOrder() {
        return order;
    }

    public void setOrder(CustomerOrder order) {
        this.order = order;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public void setOrderItemId(Long orderItemId) {
        this.orderItemId = orderItemId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductImageUrl() {
        return productImageUrl;
    }

    public void setProductImageUrl(String productImageUrl) {
        this.productImageUrl = productImageUrl;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public void setCustomerNote(String customerNote) {
        this.customerNote = customerNote;
    }

    public ReplacementStatus getStatus() {
        return status;
    }

    public void setStatus(ReplacementStatus status) {
        this.status = status;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(Instant approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public String getProofAssetUrls() {
        return proofAssetUrls;
    }

    public void setProofAssetUrls(String proofAssetUrls) {
        this.proofAssetUrls = proofAssetUrls;
    }

    public Boolean getIsFraudSuspected() {
        return isFraudSuspected;
    }

    public void setIsFraudSuspected(Boolean fraudSuspected) {
        isFraudSuspected = fraudSuspected;
    }

    public String getPickupReference() {
        return pickupReference;
    }

    public void setPickupReference(String pickupReference) {
        this.pickupReference = pickupReference;
    }

    public String getPickupStatus() {
        return pickupStatus;
    }

    public void setPickupStatus(String pickupStatus) {
        this.pickupStatus = pickupStatus;
    }

    public Instant getAdminReviewedAt() {
        return adminReviewedAt;
    }

    public void setAdminReviewedAt(Instant adminReviewedAt) {
        this.adminReviewedAt = adminReviewedAt;
    }
}
