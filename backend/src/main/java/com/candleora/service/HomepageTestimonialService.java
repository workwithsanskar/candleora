package com.candleora.service;

import com.candleora.dto.admin.AdminTestimonialRequest;
import com.candleora.dto.admin.AdminTestimonialResponse;
import com.candleora.dto.content.TestimonialResponse;
import com.candleora.entity.HomepageTestimonial;
import com.candleora.repository.HomepageTestimonialRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class HomepageTestimonialService {

    private final HomepageTestimonialRepository homepageTestimonialRepository;

    public HomepageTestimonialService(HomepageTestimonialRepository homepageTestimonialRepository) {
        this.homepageTestimonialRepository = homepageTestimonialRepository;
    }

    @Transactional(readOnly = true)
    public List<TestimonialResponse> listPublicTestimonials() {
        return homepageTestimonialRepository.findAllByActiveTrueOrderByOrderIndexAscIdAsc().stream()
            .map(this::toPublicResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminTestimonialResponse> listAdminTestimonials() {
        return homepageTestimonialRepository.findAllByOrderByOrderIndexAscIdAsc().stream()
            .map(this::toAdminResponse)
            .toList();
    }

    public AdminTestimonialResponse createTestimonial(AdminTestimonialRequest request) {
        HomepageTestimonial testimonial = new HomepageTestimonial();
        applyRequest(testimonial, request);
        return toAdminResponse(homepageTestimonialRepository.save(testimonial));
    }

    public AdminTestimonialResponse updateTestimonial(Long id, AdminTestimonialRequest request) {
        HomepageTestimonial testimonial = homepageTestimonialRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Testimonial not found"));

        applyRequest(testimonial, request);
        return toAdminResponse(homepageTestimonialRepository.save(testimonial));
    }

    private void applyRequest(HomepageTestimonial testimonial, AdminTestimonialRequest request) {
        String customerName = StringUtils.trimWhitespace(request.customerName());
        String displayDate = StringUtils.trimWhitespace(request.displayDate());
        String quote = StringUtils.trimWhitespace(request.quote());

        if (!StringUtils.hasText(customerName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }

        if (!StringUtils.hasText(displayDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display date is required");
        }

        if (!StringUtils.hasText(quote)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quote is required");
        }

        int rating = request.rating() == null ? 5 : request.rating();
        if (rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        testimonial.setCustomerName(customerName);
        testimonial.setDisplayDate(displayDate);
        testimonial.setQuote(quote);
        testimonial.setRating(rating);
        testimonial.setActive(request.active());
        testimonial.setOrderIndex(Math.max(0, request.orderIndex()));
    }

    private TestimonialResponse toPublicResponse(HomepageTestimonial testimonial) {
        return new TestimonialResponse(
            testimonial.getId(),
            testimonial.getCustomerName(),
            testimonial.getDisplayDate(),
            testimonial.getQuote(),
            testimonial.getRating(),
            testimonial.getOrderIndex()
        );
    }

    private AdminTestimonialResponse toAdminResponse(HomepageTestimonial testimonial) {
        return new AdminTestimonialResponse(
            testimonial.getId(),
            testimonial.getCustomerName(),
            testimonial.getDisplayDate(),
            testimonial.getQuote(),
            testimonial.getRating(),
            testimonial.isActive(),
            testimonial.getOrderIndex(),
            testimonial.getCreatedAt(),
            testimonial.getUpdatedAt()
        );
    }
}
