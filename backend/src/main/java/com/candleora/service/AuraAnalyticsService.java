package com.candleora.service;

import com.candleora.dto.admin.AdminDistributionItemResponse;
import com.candleora.dto.admin.AuraAdminOverviewResponse;
import com.candleora.dto.admin.AuraAdminTrainingQueueItemResponse;
import com.candleora.dto.admin.AuraAdminTrainingUpdateRequest;
import com.candleora.dto.admin.AuraAdminTrendPointResponse;
import com.candleora.dto.chat.AuraChatContext;
import com.candleora.dto.chat.AuraChatRequest;
import com.candleora.dto.chat.AuraInteractionEventRequest;
import com.candleora.entity.AppUser;
import com.candleora.entity.AuraChatEvent;
import com.candleora.entity.AuraTrainingItem;
import com.candleora.entity.AuraTrainingStatus;
import com.candleora.repository.AuraChatEventRepository;
import com.candleora.repository.AuraTrainingItemRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuraAnalyticsService {

    private static final String EVENT_CHAT_RESPONSE = "CHAT_RESPONSE";
    private static final String EVENT_SUGGESTION_CLICK = "SUGGESTION_CLICK";
    private static final String EVENT_PRODUCT_ADD_TO_CART = "PRODUCT_ADD_TO_CART";
    private static final Pattern TOKEN_SPLIT_PATTERN = Pattern.compile("[^a-z0-9]+");

    private final AuraChatEventRepository auraChatEventRepository;
    private final AuraTrainingItemRepository auraTrainingItemRepository;
    private final ObjectMapper objectMapper;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AuraAnalyticsService(
        AuraChatEventRepository auraChatEventRepository,
        AuraTrainingItemRepository auraTrainingItemRepository,
        ObjectMapper objectMapper
    ) {
        this.auraChatEventRepository = auraChatEventRepository;
        this.auraTrainingItemRepository = auraTrainingItemRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public void recordChatExchange(
        AppUser user,
        AuraChatRequest request,
        String detectedIntent,
        String responseType,
        String assistantMessage,
        boolean needsReview,
        boolean usedOpenAi,
        boolean usedTrainingOverride
    ) {
        AuraChatEvent event = new AuraChatEvent();
        event.setUser(user);
        event.setSessionScope(resolveChatScope(user, request.context() == null ? null : request.context().chatScope()));
        event.setChannel("web");
        event.setEventType(EVENT_CHAT_RESPONSE);
        event.setPagePath(trimToNull(request.context() == null ? null : request.context().pagePath()));
        event.setIntent(trimToNull(primaryIntent(detectedIntent)));
        event.setCustomerMessage(trimToNull(request.message()));
        event.setAssistantMessage(trimToNull(assistantMessage));
        event.setResponseType(trimToNull(responseType));
        event.setResolved(!needsReview);
        event.setUsedOpenAi(usedOpenAi);
        event.setUsedTrainingOverride(usedTrainingOverride);
        event.setMetadataJson(buildChatMetadata(request.context()));
        auraChatEventRepository.save(event);

        if (needsReview) {
            upsertTrainingItem(request.message(), detectedIntent, assistantMessage, request.context());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public void recordInteraction(AppUser user, AuraInteractionEventRequest request) {
        AuraChatEvent event = new AuraChatEvent();
        event.setUser(user);
        event.setSessionScope(resolveChatScope(user, request.chatScope()));
        event.setChannel("web");
        event.setEventType(normalizeEventType(request.eventType()));
        event.setPagePath(trimToNull(request.pagePath()));
        event.setIntent(trimToNull(primaryIntent(request.intent())));
        event.setCustomerMessage(trimToNull(request.message()));
        event.setResolved(true);
        event.setUsedOpenAi(false);
        event.setUsedTrainingOverride(false);
        event.setMetadataJson(buildInteractionMetadata(request));
        auraChatEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public TrainedReply findTrainedReply(String message) {
        String normalizedQuestion = normalizeQuestion(message);
        if (!StringUtils.hasText(normalizedQuestion)) {
            return null;
        }

        AuraTrainingItem exactMatch = auraTrainingItemRepository
            .findFirstByNormalizedQuestionAndStatusOrderByUpdatedAtDesc(normalizedQuestion, AuraTrainingStatus.TRAINED)
            .orElse(null);
        if (exactMatch != null && StringUtils.hasText(exactMatch.getSuggestedAnswer())) {
            return toTrainedReply(exactMatch);
        }

        Set<String> messageTokens = tokenize(normalizedQuestion);
        return auraTrainingItemRepository
            .findByStatusOrderByUpdatedAtDesc(AuraTrainingStatus.TRAINED, PageRequest.of(0, 100))
            .stream()
            .filter(item -> StringUtils.hasText(item.getSuggestedAnswer()))
            .map(item -> new ScoredTrainedReply(item, overlapScore(messageTokens, tokenize(item.getNormalizedQuestion()))))
            .filter(scored -> scored.score() >= 0.74d)
            .max(Comparator.comparing(ScoredTrainedReply::score))
            .map(scored -> toTrainedReply(scored.item()))
            .orElse(null);
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'aura-overview:' + #startDate + ':' + #endDate")
    @Transactional(readOnly = true)
    public AuraAdminOverviewResponse getOverview(LocalDate startDate, LocalDate endDate) {
        DateWindow window = resolveWindow(startDate, endDate);
        List<AuraChatEvent> events = loadEvents(window);
        List<AuraChatEvent> conversationEvents = events.stream()
            .filter(event -> EVENT_CHAT_RESPONSE.equals(event.getEventType()))
            .toList();

        long totalConversations = conversationEvents.size();
        long aiPolishedReplies = conversationEvents.stream().filter(AuraChatEvent::isUsedOpenAi).count();
        long trainedReplyHits = conversationEvents.stream().filter(AuraChatEvent::isUsedTrainingOverride).count();
        long unresolvedReplies = conversationEvents.stream().filter(event -> !event.isResolved()).count();
        long suggestionClicks = events.stream().filter(event -> EVENT_SUGGESTION_CLICK.equals(event.getEventType())).count();
        long productAddToCartActions = events.stream().filter(event -> EVENT_PRODUCT_ADD_TO_CART.equals(event.getEventType())).count();

        BigDecimal resolutionRate = totalConversations == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(totalConversations - unresolvedReplies)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalConversations), 2, RoundingMode.HALF_UP);

        return new AuraAdminOverviewResponse(
            totalConversations,
            aiPolishedReplies,
            trainedReplyHits,
            unresolvedReplies,
            suggestionClicks,
            productAddToCartActions,
            auraTrainingItemRepository.countByStatus(AuraTrainingStatus.OPEN),
            resolutionRate,
            groupByIntent(conversationEvents),
            groupByEventType(events),
            buildTrend(window, events)
        );
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'aura-training:' + #status + ':' + #limit")
    @Transactional(readOnly = true)
    public List<AuraAdminTrainingQueueItemResponse> getTrainingQueue(AuraTrainingStatus status, int limit) {
        int resolvedLimit = Math.min(Math.max(limit, 1), 50);
        List<AuraTrainingItem> items = status == null
            ? auraTrainingItemRepository.findAllByOrderByUpdatedAtDesc(PageRequest.of(0, resolvedLimit)).getContent()
            : auraTrainingItemRepository.findByStatusOrderByUpdatedAtDesc(status, PageRequest.of(0, resolvedLimit)).getContent();

        return items.stream().map(this::toTrainingQueueItem).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "adminAnalytics", allEntries = true)
    public AuraAdminTrainingQueueItemResponse updateTrainingItem(Long id, AuraAdminTrainingUpdateRequest request) {
        AuraTrainingItem item = auraTrainingItemRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aura training item not found"));

        if (request.status() == AuraTrainingStatus.TRAINED && !StringUtils.hasText(request.suggestedAnswer())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Suggested answer is required when marking a training item as trained"
            );
        }

        item.setStatus(request.status());
        item.setSuggestedAnswer(trimToNull(request.suggestedAnswer()));
        item.setResolutionNotes(trimToNull(request.resolutionNotes()));
        return toTrainingQueueItem(auraTrainingItemRepository.save(item));
    }

    private void upsertTrainingItem(
        String question,
        String detectedIntent,
        String assistantMessage,
        AuraChatContext context
    ) {
        String normalizedQuestion = normalizeQuestion(question);
        if (!StringUtils.hasText(normalizedQuestion)) {
            return;
        }

        AuraTrainingItem item = auraTrainingItemRepository
            .findFirstByNormalizedQuestionAndStatusOrderByUpdatedAtDesc(normalizedQuestion, AuraTrainingStatus.OPEN)
            .orElseGet(AuraTrainingItem::new);

        if (item.getId() == null) {
            item.setQuestion(question.trim());
            item.setNormalizedQuestion(normalizedQuestion);
            item.setDetectedIntent(trimToNull(primaryIntent(detectedIntent)));
            item.setPagePath(trimToNull(context == null ? null : context.pagePath()));
            item.setLastAssistantMessage(trimToNull(assistantMessage));
        } else {
            item.incrementOccurrences();
            item.setLastAssistantMessage(trimToNull(assistantMessage));
            item.setDetectedIntent(trimToNull(primaryIntent(detectedIntent)));
            item.setPagePath(trimToNull(context == null ? null : context.pagePath()));
        }

        auraTrainingItemRepository.save(item);
    }

    private AuraAdminTrainingQueueItemResponse toTrainingQueueItem(AuraTrainingItem item) {
        return new AuraAdminTrainingQueueItemResponse(
            item.getId(),
            item.getQuestion(),
            item.getDetectedIntent(),
            item.getOccurrences(),
            item.getLastAssistantMessage(),
            item.getPagePath(),
            item.getStatus(),
            item.getSuggestedAnswer(),
            item.getResolutionNotes(),
            item.getCreatedAt(),
            item.getUpdatedAt()
        );
    }

    private TrainedReply toTrainedReply(AuraTrainingItem item) {
        return new TrainedReply(
            item.getSuggestedAnswer().trim(),
            item.getQuestion(),
            List.of("Gift ideas", "Track order", "Best sellers")
        );
    }

    private String buildChatMetadata(AuraChatContext context) {
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("authenticated", context != null && Boolean.TRUE.equals(context.authenticated()));
        metadata.put("cartItems", context == null || context.cartItems() == null ? 0 : context.cartItems().size());
        metadata.put("wishlistItems", context == null || context.wishlistItems() == null ? 0 : context.wishlistItems().size());
        metadata.put("chatScope", safeValue(context == null ? null : context.chatScope()));
        return writeJson(metadata);
    }

    private String buildInteractionMetadata(AuraInteractionEventRequest request) {
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("productId", request.productId() == null ? -1 : request.productId());
        metadata.put("orderId", request.orderId() == null ? -1 : request.orderId());
        metadata.put("label", safeValue(request.message()));
        if (request.metadata() != null && !request.metadata().isEmpty()) {
            metadata.set("extra", objectMapper.valueToTree(request.metadata()));
        }
        return writeJson(metadata);
    }

    private String writeJson(ObjectNode metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }

    private String normalizeEventType(String value) {
        String normalized = normalizeQuestion(value).replace(' ', '_').toUpperCase(Locale.ROOT);
        return StringUtils.hasText(normalized) ? normalized : "UNKNOWN";
    }

    private String resolveChatScope(AppUser user, String requestedScope) {
        if (StringUtils.hasText(requestedScope)) {
            return requestedScope.trim();
        }
        if (user != null && user.getId() != null) {
            return "user:" + user.getId();
        }
        return "guest";
    }

    private List<AdminDistributionItemResponse> groupByIntent(List<AuraChatEvent> events) {
        Map<String, Long> counts = events.stream()
            .collect(Collectors.groupingBy(
                event -> formatIntentLabel(event.getIntent()),
                LinkedHashMap::new,
                Collectors.counting()
            ));

        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(6)
            .map(entry -> new AdminDistributionItemResponse(entry.getKey(), BigDecimal.valueOf(entry.getValue())))
            .toList();
    }

    private List<AdminDistributionItemResponse> groupByEventType(List<AuraChatEvent> events) {
        Map<String, Long> counts = events.stream()
            .collect(Collectors.groupingBy(
                event -> formatEventLabel(event.getEventType()),
                LinkedHashMap::new,
                Collectors.counting()
            ));

        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(6)
            .map(entry -> new AdminDistributionItemResponse(entry.getKey(), BigDecimal.valueOf(entry.getValue())))
            .toList();
    }

    private List<AuraAdminTrendPointResponse> buildTrend(DateWindow window, List<AuraChatEvent> events) {
        Map<LocalDate, TrendSnapshot> trend = new LinkedHashMap<>();
        for (LocalDate date = window.start(); !date.isAfter(window.end()); date = date.plusDays(1)) {
            trend.put(date, new TrendSnapshot());
        }

        for (AuraChatEvent event : events) {
            LocalDate date = event.getCreatedAt().atZone(zoneId).toLocalDate();
            TrendSnapshot snapshot = trend.computeIfAbsent(date, ignored -> new TrendSnapshot());
            if (EVENT_CHAT_RESPONSE.equals(event.getEventType())) {
                snapshot.conversations++;
                if (!event.isResolved()) {
                    snapshot.unresolvedReplies++;
                }
            }
            if (EVENT_PRODUCT_ADD_TO_CART.equals(event.getEventType())) {
                snapshot.addToCartActions++;
            }
        }

        return trend.entrySet().stream()
            .map(entry -> new AuraAdminTrendPointResponse(
                entry.getKey().toString(),
                entry.getValue().conversations,
                entry.getValue().unresolvedReplies,
                entry.getValue().addToCartActions
            ))
            .toList();
    }

    private List<AuraChatEvent> loadEvents(DateWindow window) {
        Instant start = window.start().atStartOfDay(zoneId).toInstant();
        Instant end = window.end().plusDays(1).atStartOfDay(zoneId).toInstant();
        return auraChatEventRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end);
    }

    private DateWindow resolveWindow(LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now(zoneId);
        LocalDate resolvedEnd = endDate != null ? endDate : today;
        LocalDate resolvedStart = startDate != null ? startDate : resolvedEnd.minusDays(29);
        if (resolvedStart.isAfter(resolvedEnd)) {
            LocalDate swap = resolvedStart;
            resolvedStart = resolvedEnd;
            resolvedEnd = swap;
        }
        return new DateWindow(resolvedStart, resolvedEnd);
    }

    private String normalizeQuestion(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.toLowerCase(Locale.ROOT).trim();
        normalized = normalized.replace("candle ora", "candleora");
        normalized = normalized.replace("best sellers", "bestsellers");
        normalized = normalized.replace("best seller", "bestseller");
        normalized = normalized.replaceAll("\\s+", " ");
        normalized = normalized.replaceAll("[^a-z0-9\\s]", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();
        return normalized;
    }

    private Set<String> tokenize(String value) {
        return TOKEN_SPLIT_PATTERN.splitAsStream(normalizeQuestion(value))
            .filter(StringUtils::hasText)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private double overlapScore(Set<String> left, Set<String> right) {
        if (left.isEmpty() || right.isEmpty()) {
            return 0;
        }

        int overlaps = 0;
        for (String token : left) {
            if (right.contains(token)) {
                overlaps++;
            }
        }

        if (overlaps < 2) {
            return 0;
        }

        return BigDecimal.valueOf(overlaps)
            .divide(BigDecimal.valueOf(Math.max(Math.min(left.size(), right.size()), 1)), 4, RoundingMode.HALF_UP)
            .doubleValue();
    }

    private String primaryIntent(String intent) {
        if (!StringUtils.hasText(intent)) {
            return "general";
        }

        String[] parts = intent.split(",");
        return parts.length == 0 ? intent.trim() : parts[0].trim();
    }

    private String formatIntentLabel(String intent) {
        String source = StringUtils.hasText(intent) ? intent : "general";
        return titleCase(source.replace('_', ' ').replace('-', ' '));
    }

    private String formatEventLabel(String eventType) {
        if (!StringUtils.hasText(eventType)) {
            return "Unknown";
        }

        return switch (eventType) {
            case EVENT_CHAT_RESPONSE -> "Chats";
            case EVENT_SUGGESTION_CLICK -> "Suggestion taps";
            case EVENT_PRODUCT_ADD_TO_CART -> "Aura add to cart";
            default -> titleCase(eventType.replace('_', ' '));
        };
    }

    private String titleCase(String value) {
        return List.of(value.trim().split("\\s+")).stream()
            .filter(StringUtils::hasText)
            .map(token -> token.substring(0, 1).toUpperCase(Locale.ROOT) + token.substring(1).toLowerCase(Locale.ROOT))
            .collect(Collectors.joining(" "));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String safeValue(String value) {
        return value == null ? "" : value;
    }

    public record TrainedReply(String answer, String sourceQuestion, List<String> suggestions) {
    }

    private record ScoredTrainedReply(AuraTrainingItem item, double score) {
    }

    private record DateWindow(LocalDate start, LocalDate end) {
    }

    private static class TrendSnapshot {
        private long conversations;
        private long unresolvedReplies;
        private long addToCartActions;
    }
}
