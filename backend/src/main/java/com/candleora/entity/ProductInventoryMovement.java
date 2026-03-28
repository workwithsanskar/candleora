package com.candleora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(
    name = "product_inventory_movements",
    indexes = {
        @Index(name = "idx_inventory_movements_product_id_created_at", columnList = "product_id, created_at"),
        @Index(name = "idx_inventory_movements_reference", columnList = "reference_type, reference_id")
    }
)
public class ProductInventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InventoryMovementType type;

    @Column(nullable = false)
    private Integer onHandDelta;

    @Column(nullable = false)
    private Integer reservedDelta;

    @Column(nullable = false)
    private Integer onHandAfter;

    @Column(nullable = false)
    private Integer reservedAfter;

    @Column(nullable = false)
    private Integer availableAfter;

    @Column(length = 64)
    private String referenceType;

    @Column
    private Long referenceId;

    @Column(length = 512)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public InventoryMovementType getType() {
        return type;
    }

    public void setType(InventoryMovementType type) {
        this.type = type;
    }

    public Integer getOnHandDelta() {
        return onHandDelta;
    }

    public void setOnHandDelta(Integer onHandDelta) {
        this.onHandDelta = onHandDelta;
    }

    public Integer getReservedDelta() {
        return reservedDelta;
    }

    public void setReservedDelta(Integer reservedDelta) {
        this.reservedDelta = reservedDelta;
    }

    public Integer getOnHandAfter() {
        return onHandAfter;
    }

    public void setOnHandAfter(Integer onHandAfter) {
        this.onHandAfter = onHandAfter;
    }

    public Integer getReservedAfter() {
        return reservedAfter;
    }

    public void setReservedAfter(Integer reservedAfter) {
        this.reservedAfter = reservedAfter;
    }

    public Integer getAvailableAfter() {
        return availableAfter;
    }

    public void setAvailableAfter(Integer availableAfter) {
        this.availableAfter = availableAfter;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
