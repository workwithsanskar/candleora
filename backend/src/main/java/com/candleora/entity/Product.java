package com.candleora.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

@Entity
@Table(
    name = "products",
    indexes = {
        @Index(name = "idx_products_slug", columnList = "slug", unique = true),
        @Index(name = "idx_products_sku", columnList = "sku", unique = true),
        @Index(name = "idx_products_visible_created_at", columnList = "visible, created_at"),
        @Index(name = "idx_products_visible_price", columnList = "visible, price"),
        @Index(name = "idx_products_visible_rating_created_at", columnList = "visible, rating, created_at"),
        @Index(name = "idx_products_visible_category_created_at", columnList = "visible, category_id, created_at"),
        @Index(name = "idx_products_visible_occasion_created_at", columnList = "visible, occasion_tag, created_at")
    }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(unique = true, length = 64)
    private String sku;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false, precision = 10, scale = 2, columnDefinition = "DECIMAL(10,2) DEFAULT 0.00")
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer discount;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 5")
    private Integer lowStockThreshold = 5;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer reservedStock = 0;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean visible = true;

    @Column(nullable = false)
    private String occasionTag;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(nullable = false, length = 1200)
    private String scentNotes;

    @Column(nullable = false, length = 120)
    private String burnTime;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", nullable = false, length = 1024)
    @BatchSize(size = 24)
    @Fetch(FetchMode.SUBSELECT)
    private List<String> imageUrls = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getOriginalPrice() {
        return originalPrice;
    }

    public void setOriginalPrice(BigDecimal originalPrice) {
        this.originalPrice = originalPrice;
    }

    public BigDecimal getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }

    public Integer getDiscount() {
        return discount;
    }

    public void setDiscount(Integer discount) {
        this.discount = discount;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public Integer getReservedStock() {
        return reservedStock;
    }

    public void setReservedStock(Integer reservedStock) {
        this.reservedStock = reservedStock;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }

    public String getOccasionTag() {
        return occasionTag;
    }

    public void setOccasionTag(String occasionTag) {
        this.occasionTag = occasionTag;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public String getScentNotes() {
        return scentNotes;
    }

    public void setScentNotes(String scentNotes) {
        this.scentNotes = scentNotes;
    }

    public String getBurnTime() {
        return burnTime;
    }

    public void setBurnTime(String burnTime) {
        this.burnTime = burnTime;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public int getAvailableStock() {
        int onHand = stock == null ? 0 : stock;
        int reserved = reservedStock == null ? 0 : reservedStock;
        return Math.max(onHand - reserved, 0);
    }
}
