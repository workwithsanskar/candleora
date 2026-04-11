package com.candleora.controller;

import com.candleora.dto.content.AnnouncementResponse;
import com.candleora.dto.content.CandleFixResponse;
import com.candleora.dto.content.ContactMessageRequest;
import com.candleora.dto.content.ContactMessageResponse;
import com.candleora.dto.content.FaqResponse;
import com.candleora.dto.content.StylingGuideResponse;
import com.candleora.dto.content.TestimonialResponse;
import com.candleora.service.AnnouncementService;
import com.candleora.service.ContentService;
import com.candleora.service.HomepageTestimonialService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ContentController {

    private final AnnouncementService announcementService;
    private final ContentService contentService;
    private final HomepageTestimonialService homepageTestimonialService;

    public ContentController(
        AnnouncementService announcementService,
        ContentService contentService,
        HomepageTestimonialService homepageTestimonialService
    ) {
        this.announcementService = announcementService;
        this.contentService = contentService;
        this.homepageTestimonialService = homepageTestimonialService;
    }

    @GetMapping("/announcements")
    public List<AnnouncementResponse> getAnnouncements() {
        return announcementService.listPublicAnnouncements();
    }

    @GetMapping("/testimonials")
    public List<TestimonialResponse> getTestimonials() {
        return homepageTestimonialService.listPublicTestimonials();
    }

    @GetMapping("/fixes")
    public List<CandleFixResponse> getFixes() {
        return contentService.getFixes();
    }

    @GetMapping("/guides")
    public List<StylingGuideResponse> getGuides() {
        return contentService.getGuides();
    }

    @GetMapping("/faqs")
    public List<FaqResponse> getFaqs() {
        return contentService.getFaqs();
    }

    @PostMapping("/contact")
    public ContactMessageResponse createContactMessage(@Valid @RequestBody ContactMessageRequest request) {
        return contentService.createContactMessage(request);
    }
}
