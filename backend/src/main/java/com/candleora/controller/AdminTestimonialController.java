package com.candleora.controller;

import com.candleora.dto.admin.AdminTestimonialRequest;
import com.candleora.dto.admin.AdminTestimonialResponse;
import com.candleora.service.HomepageTestimonialService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/testimonials")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTestimonialController {

    private final HomepageTestimonialService homepageTestimonialService;

    public AdminTestimonialController(HomepageTestimonialService homepageTestimonialService) {
        this.homepageTestimonialService = homepageTestimonialService;
    }

    @GetMapping
    public List<AdminTestimonialResponse> listTestimonials() {
        return homepageTestimonialService.listAdminTestimonials();
    }

    @PostMapping
    public AdminTestimonialResponse createTestimonial(@Valid @RequestBody AdminTestimonialRequest request) {
        return homepageTestimonialService.createTestimonial(request);
    }

    @PutMapping("/{id}")
    public AdminTestimonialResponse updateTestimonial(
        @PathVariable Long id,
        @Valid @RequestBody AdminTestimonialRequest request
    ) {
        return homepageTestimonialService.updateTestimonial(id, request);
    }
}
