package com.candleora.controller;

import com.candleora.dto.content.CandleFixResponse;
import com.candleora.dto.content.FaqResponse;
import com.candleora.dto.content.StylingGuideResponse;
import com.candleora.service.ContentService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
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
}
