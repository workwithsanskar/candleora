package com.candleora.service;

import com.candleora.dto.catalog.CategoryResponse;
import com.candleora.dto.catalog.ProductResponse;
import com.candleora.dto.catalog.ProductSummaryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.entity.Product;
import com.candleora.repository.CategoryRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public CatalogService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Cacheable(cacheNames = "catalogProductPages")
    public PagedResponse<ProductSummaryResponse> getProducts(
        String search,
        String category,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String occasion,
        String occasions,
        String sort,
        int page,
        int size
    ) {
        Specification<Product> specification = Specification.where((root, query, criteriaBuilder) ->
            criteriaBuilder.isTrue(root.get("visible"))
        );

        if (search != null && !search.isBlank()) {
            String keyword = "%" + search.toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), keyword)
                )
            );
        }

        if (category != null && !category.isBlank()) {
            String slug = category.toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.equal(criteriaBuilder.lower(root.join("category").get("slug")), slug)
            );
        }

        List<String> occasionTags = resolveOccasionTags(occasion, occasions);
        if (!occasionTags.isEmpty()) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.lower(root.get("occasionTag")).in(occasionTags)
            );
        }

        if (minPrice != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice)
            );
        }

        if (maxPrice != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice)
            );
        }

        Page<ProductSummaryResponse> productPage = productRepository.findAll(
            specification,
            PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 24), resolveSort(sort))
        ).map(this::toProductSummaryResponse);

        return PagedResponse.from(productPage);
    }

    @Cacheable(cacheNames = "catalogProductDetail")
    public ProductResponse getProduct(String identifier) {
        return toProductResponse(findProduct(identifier));
    }

    @Cacheable(cacheNames = "catalogRelatedProducts")
    public List<ProductSummaryResponse> getRelatedProducts(String identifier) {
        Product product = findProduct(identifier);

        return productRepository.findTop4ByCategoryAndVisibleTrueAndIdNotOrderByCreatedAtDesc(
                product.getCategory(),
                product.getId()
            )
            .stream()
            .map(this::toProductSummaryResponse)
            .toList();
    }

    @Cacheable(cacheNames = "catalogCategories")
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll(Sort.by("name"))
            .stream()
            .map(category -> new CategoryResponse(category.getId(), category.getName(), category.getSlug()))
            .toList();
    }

    private Sort resolveSort(String sort) {
        if ("price-asc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("price"));
        }
        if ("price-desc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("price"));
        }
        if ("newest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("createdAt"));
        }
        return Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("createdAt"));
    }

    private Product findProduct(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        try {
            Long numericId = Long.parseLong(identifier);
            Product product = productRepository.findById(numericId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            if (!product.isVisible()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            return product;
        } catch (NumberFormatException ignored) {
            Product product = productRepository.findBySlugIgnoreCase(identifier)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
            if (!product.isVisible()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            return product;
        }
    }

    private ProductResponse toProductResponse(Product product) {
        return new ProductResponse(
            product.getId(),
            product.getName(),
            product.getSlug(),
            product.getDescription(),
            product.getPrice(),
            product.getOriginalPrice(),
            product.getDiscount(),
            product.getStock(),
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

    private ProductSummaryResponse toProductSummaryResponse(Product product) {
        return new ProductSummaryResponse(
            product.getId(),
            product.getName(),
            product.getSlug(),
            product.getPrice(),
            product.getOriginalPrice(),
            product.getDiscount(),
            product.getStock(),
            product.getOccasionTag(),
            product.getRating(),
            new CategoryResponse(
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getSlug()
            ),
            product.getImageUrls().stream().findFirst().orElse(null)
        );
    }

    private List<String> resolveOccasionTags(String occasion, String occasions) {
        return Arrays.stream(new String[] { occasion, occasions })
            .filter(StringUtils::hasText)
            .flatMap(value -> Arrays.stream(value.split(",")))
            .map(String::trim)
            .filter(StringUtils::hasText)
            .map(value -> value.toLowerCase(Locale.ROOT))
            .distinct()
            .filter(Objects::nonNull)
            .toList();
    }
}
