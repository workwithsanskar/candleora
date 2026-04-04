package com.candleora;

import com.candleora.config.DataSeeder;
import com.candleora.entity.Faq;
import com.candleora.repository.FaqRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContentControllerIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private FaqRepository faqRepository;

    @Autowired
    private DataSeeder dataSeeder;

    @Test
    void contentEndpointsReturnSeededContent() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/fixes"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").exists());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/guides"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].slug").exists());

        mockMvc.perform(MockMvcRequestBuilders.get("/api/faqs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].question").exists());
    }

    @Test
    void dataSeederSynchronizesFaqsEvenWhenLegacyEntriesExist() {
        List<Faq> existingFaqs = faqRepository.findAllByOrderByOrderIndexAsc();
        assertEquals(12, existingFaqs.size());

        Faq firstFaq = existingFaqs.get(0);
        firstFaq.setAnswer("Legacy answer that should be replaced.");
        faqRepository.save(firstFaq);

        Faq legacyFaq = new Faq();
        legacyFaq.setQuestion("Legacy cleanup question");
        legacyFaq.setAnswer("Stale FAQ content");
        legacyFaq.setOrderIndex(999);
        faqRepository.save(legacyFaq);

        dataSeeder.run(new DefaultApplicationArguments(new String[0]));

        List<Faq> syncedFaqs = faqRepository.findAllByOrderByOrderIndexAsc();
        assertEquals(12, syncedFaqs.size());
        assertEquals("What makes CandleOra candles special?", syncedFaqs.get(0).getQuestion());
        assertEquals(
            "Our candles are handmade with love, tested for quality and burn performance, and designed to enhance your mood, freshen your space, and create a calming ambiance.",
            syncedFaqs.get(0).getAnswer()
        );
        assertFalse(
            syncedFaqs.stream().anyMatch((faq) -> "Legacy cleanup question".equals(faq.getQuestion()))
        );
    }
}
