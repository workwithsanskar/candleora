package com.candleora.controller;

import com.candleora.dto.catalog.CategoryResponse;
import com.candleora.dto.catalog.ProductResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.service.CatalogService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/products")
    public PagedResponse<ProductResponse> getProducts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(required = false) String occasion,
        @RequestParam(defaultValue = "popular") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "8") int size
    ) {
        return catalogService.getProducts(search, category, minPrice, maxPrice, occasion, sort, page, size);
    }

    @GetMapping("/products/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return catalogService.getProduct(id);
    }

    @GetMapping("/products/{id}/related")
    public List<ProductResponse> getRelatedProducts(@PathVariable Long id) {
        return catalogService.getRelatedProducts(id);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> getCategories() {
        return catalogService.getCategories();
    }
}
