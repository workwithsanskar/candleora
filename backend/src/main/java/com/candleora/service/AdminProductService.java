package com.candleora.service;

import com.candleora.dto.admin.AdminProductRequest;
import com.candleora.dto.admin.AdminProductResponse;
import com.candleora.dto.catalog.CategoryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.entity.Category;
import com.candleora.entity.Product;
import com.candleora.repository.CategoryRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AdminProductService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final BigDecimal DEFAULT_COST_MULTIPLIER = BigDecimal.valueOf(0.58);
    private static final BigDecimal DEFAULT_RATING = BigDecimal.valueOf(4.5);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public AdminProductService(
        ProductRepository productRepository,
        CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminProductResponse> getProducts(
        String search,
        String category,
        String stock,
        int page,
        int size
    ) {
        Specification<Product> specification = Specification.where(null);

        if (StringUtils.hasText(search)) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("slug")), keyword)
                )
            );
        }

        if (StringUtils.hasText(category)) {
            String categorySlug = category.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.equal(criteriaBuilder.lower(root.join("category").get("slug")), categorySlug)
            );
        }

        if (StringUtils.hasText(stock)) {
            String normalizedStock = stock.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, criteriaBuilder) -> switch (normalizedStock) {
                case "in-stock" -> criteriaBuilder.greaterThan(root.get("stock"), 5);
                case "low-stock" -> criteriaBuilder.and(
                    criteriaBuilder.greaterThan(root.get("stock"), 0),
                    criteriaBuilder.lessThanOrEqualTo(root.get("stock"), 5)
                );
                case "out-of-stock" -> criteriaBuilder.lessThanOrEqualTo(root.get("stock"), 0);
                case "hidden" -> criteriaBuilder.isFalse(root.get("visible"));
                default -> criteriaBuilder.conjunction();
            });
        }

        Page<AdminProductResponse> productPage = productRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"))
            )
        ).map(this::toProductResponse);

        return PagedResponse.from(productPage);
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AdminProductResponse createProduct(AdminProductRequest request) {
        validateCreateRequest(request);

        Product product = new Product();
        applyRequest(product, request, true);
        return toProductResponse(productRepository.save(product));
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AdminProductResponse updateProduct(Long id, AdminProductRequest request) {
        Product product = findProduct(id);
        applyRequest(product, request, false);
        return toProductResponse(productRepository.save(product));
    }

    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public void deleteProduct(Long id) {
        Product product = findProduct(id);
        try {
            productRepository.delete(product);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This product is referenced by existing records and cannot be deleted right now"
            );
        }
    }

    private void validateCreateRequest(AdminProductRequest request) {
        if (!StringUtils.hasText(request.name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name is required");
        }
        if (request.price() == null || request.price().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price is required");
        }
        if (request.stock() == null || request.stock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock is required");
        }
        if (request.categoryId() == null && !StringUtils.hasText(request.categorySlug())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
        }
    }

    private void applyRequest(Product product, AdminProductRequest request, boolean creating) {
        if (StringUtils.hasText(request.name())) {
            product.setName(request.name().trim());
        }

        if (request.price() != null) {
            product.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        }

        if (request.stock() != null) {
            product.setStock(request.stock());
        }

        if (request.originalPrice() != null) {
            product.setOriginalPrice(request.originalPrice().setScale(2, RoundingMode.HALF_UP));
        } else if (creating && product.getPrice() != null) {
            product.setOriginalPrice(product.getPrice());
        }

        if (request.costPrice() != null) {
            product.setCostPrice(request.costPrice().setScale(2, RoundingMode.HALF_UP));
        } else if (creating && product.getPrice() != null) {
            product.setCostPrice(defaultCostPrice(product.getPrice()));
        }

        if (StringUtils.hasText(request.description())) {
            product.setDescription(request.description().trim());
        } else if (creating && StringUtils.hasText(product.getName())) {
            product.setDescription(product.getName().trim());
        }

        if (StringUtils.hasText(request.occasionTag())) {
            product.setOccasionTag(request.occasionTag().trim());
        } else if (creating) {
            product.setOccasionTag("Signature");
        }

        if (request.rating() != null) {
            product.setRating(request.rating().setScale(1, RoundingMode.HALF_UP));
        } else if (creating) {
            product.setRating(DEFAULT_RATING);
        }

        if (StringUtils.hasText(request.scentNotes())) {
            product.setScentNotes(request.scentNotes().trim());
        } else if (creating) {
            product.setScentNotes("Signature fragrance blend");
        }

        if (StringUtils.hasText(request.burnTime())) {
            product.setBurnTime(request.burnTime().trim());
        } else if (creating) {
            product.setBurnTime("35-40 hours");
        }

        if (request.visible() != null) {
            product.setVisible(request.visible());
        } else if (creating) {
            product.setVisible(true);
        }

        if (request.imageUrls() != null) {
            product.setImageUrls(
                request.imageUrls().stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .distinct()
                    .toList()
            );
        }

        if (request.categoryId() != null || StringUtils.hasText(request.categorySlug())) {
            product.setCategory(resolveCategory(request.categoryId(), request.categorySlug()));
        }

        if (product.getOriginalPrice() == null && product.getPrice() != null) {
            product.setOriginalPrice(product.getPrice());
        }

        if (product.getCostPrice() == null && product.getPrice() != null) {
            product.setCostPrice(defaultCostPrice(product.getPrice()));
        }

        if (product.getPrice() != null && product.getOriginalPrice() != null) {
            if (product.getOriginalPrice().compareTo(product.getPrice()) < 0) {
                product.setOriginalPrice(product.getPrice());
            }
            product.setDiscount(calculateDiscount(product.getOriginalPrice(), product.getPrice()));
        }

        if (StringUtils.hasText(request.slug())) {
            product.setSlug(resolveUniqueSlug(request.slug(), product.getId()));
        } else if (creating && StringUtils.hasText(product.getName())) {
            product.setSlug(resolveUniqueSlug(product.getName(), product.getId()));
        }
    }

    private Category resolveCategory(Long categoryId, String categorySlug) {
        if (categoryId != null) {
            return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        }

        return categoryRepository.findBySlugIgnoreCase(categorySlug.trim())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private BigDecimal defaultCostPrice(BigDecimal price) {
        return price.multiply(DEFAULT_COST_MULTIPLIER).setScale(2, RoundingMode.HALF_UP);
    }

    private int calculateDiscount(BigDecimal originalPrice, BigDecimal price) {
        if (originalPrice == null || price == null || originalPrice.signum() <= 0) {
            return 0;
        }

        BigDecimal discount = originalPrice
            .subtract(price)
            .divide(originalPrice, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100));

        return Math.max(discount.setScale(0, RoundingMode.HALF_UP).intValue(), 0);
    }

    private String resolveUniqueSlug(String source, Long currentProductId) {
        String baseSlug = slugify(source);
        if (!StringUtils.hasText(baseSlug)) {
            baseSlug = "candleora-product";
        }

        String candidate = baseSlug;
        int suffix = 2;
        while (slugTaken(candidate, currentProductId)) {
            candidate = baseSlug + "-" + suffix++;
        }
        return candidate;
    }

    private boolean slugTaken(String slug, Long currentProductId) {
        return productRepository.findBySlugIgnoreCase(slug)
            .filter(product -> !product.getId().equals(currentProductId))
            .isPresent();
    }

    private String slugify(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
    }

    private String stockStatus(Product product) {
        if (!product.isVisible()) {
            return "Hidden";
        }
        if (product.getStock() == null || product.getStock() <= 0) {
            return "Out of stock";
        }
        if (product.getStock() <= 5) {
            return "Low stock";
        }
        return "Live";
    }

    private AdminProductResponse toProductResponse(Product product) {
        return new AdminProductResponse(
            product.getId(),
            product.getName(),
            product.getSlug(),
            product.getDescription(),
            product.getPrice(),
            product.getOriginalPrice(),
            product.getCostPrice(),
            product.getDiscount(),
            product.getStock(),
            stockStatus(product),
            product.isVisible(),
            product.getOccasionTag(),
            product.getRating(),
            product.getScentNotes(),
            product.getBurnTime(),
            new CategoryResponse(
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getSlug()
            ),
            product.getImageUrls(),
            product.getCreatedAt()
        );
    }
}
