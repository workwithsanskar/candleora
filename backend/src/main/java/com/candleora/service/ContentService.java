package com.candleora.service;

import com.candleora.dto.content.CandleFixResponse;
import com.candleora.dto.content.ContactMessageRequest;
import com.candleora.dto.content.ContactMessageResponse;
import com.candleora.dto.content.FaqResponse;
import com.candleora.dto.content.StylingGuideResponse;
import com.candleora.entity.ContactMessage;
import com.candleora.repository.CandleFixRepository;
import com.candleora.repository.ContactMessageRepository;
import com.candleora.repository.FaqRepository;
import com.candleora.repository.StylingGuideRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ContentService {

    private final CandleFixRepository candleFixRepository;
    private final StylingGuideRepository stylingGuideRepository;
    private final FaqRepository faqRepository;
    private final ContactMessageRepository contactMessageRepository;

    public ContentService(
        CandleFixRepository candleFixRepository,
        StylingGuideRepository stylingGuideRepository,
        FaqRepository faqRepository,
        ContactMessageRepository contactMessageRepository
    ) {
        this.candleFixRepository = candleFixRepository;
        this.stylingGuideRepository = stylingGuideRepository;
        this.faqRepository = faqRepository;
        this.contactMessageRepository = contactMessageRepository;
    }

    public List<CandleFixResponse> getFixes() {
        return candleFixRepository.findAllByOrderByIdAsc()
            .stream()
            .map(fix -> new CandleFixResponse(
                fix.getId(),
                fix.getTitle(),
                fix.getCause(),
                fix.getFixSteps(),
                fix.getVideoUrl(),
                fix.getBeforeImage(),
                fix.getAfterImage()
            ))
            .toList();
    }

    public List<StylingGuideResponse> getGuides() {
        return stylingGuideRepository.findAllByOrderByIdAsc()
            .stream()
            .map(guide -> new StylingGuideResponse(
                guide.getId(),
                guide.getTitle(),
                guide.getSlug(),
                guide.getDescription(),
                guide.getImageUrl(),
                guide.getDetailedContent()
            ))
            .toList();
    }

    public List<FaqResponse> getFaqs() {
        return faqRepository.findAllByOrderByOrderIndexAsc()
            .stream()
            .map(faq -> new FaqResponse(
                faq.getId(),
                faq.getQuestion(),
                faq.getAnswer(),
                faq.getOrderIndex()
            ))
            .toList();
    }

    @Transactional
    public ContactMessageResponse createContactMessage(ContactMessageRequest request) {
        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setName(request.name().trim());
        contactMessage.setEmail(request.email().trim().toLowerCase());
        contactMessage.setPhone(request.phone().trim());
        contactMessage.setSubject(request.subject().trim());
        contactMessage.setMessage(request.message().trim());

        ContactMessage savedMessage = contactMessageRepository.save(contactMessage);

        return new ContactMessageResponse(
            savedMessage.getId(),
            savedMessage.getName(),
            savedMessage.getEmail(),
            savedMessage.getPhone(),
            savedMessage.getSubject(),
            savedMessage.getMessage(),
            savedMessage.getCreatedAt()
        );
    }
}
