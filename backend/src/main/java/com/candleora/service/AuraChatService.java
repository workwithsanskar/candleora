package com.candleora.service;

import com.candleora.dto.catalog.ProductSummaryResponse;
import com.candleora.dto.chat.AuraChatAction;
import com.candleora.dto.chat.AuraChatCartItem;
import com.candleora.dto.chat.AuraChatContext;
import com.candleora.dto.chat.AuraChatMessage;
import com.candleora.dto.chat.AuraChatRequest;
import com.candleora.dto.chat.AuraChatResponse;
import com.candleora.dto.chat.AuraChatWishlistItem;
import com.candleora.dto.chat.AuraCollectionItemResponse;
import com.candleora.dto.chat.AuraCollectionSummaryResponse;
import com.candleora.dto.chat.AuraOrderItemSummaryResponse;
import com.candleora.dto.chat.AuraOrderSummaryResponse;
import com.candleora.dto.content.CandleFixResponse;
import com.candleora.dto.content.FaqResponse;
import com.candleora.dto.order.OrderItemResponse;
import com.candleora.dto.order.OrderResponse;
import com.candleora.entity.AppUser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AuraChatService {

    private static final Logger logger = LoggerFactory.getLogger(AuraChatService.class);
    private static final String RESPONSE_TYPE_TEXT = "text";
    private static final String RESPONSE_TYPE_PRODUCTS = "products";
    private static final String RESPONSE_TYPE_ORDER = "order";
    private static final String RESPONSE_TYPE_CART = "cart";
    private static final String RESPONSE_TYPE_WISHLIST = "wishlist";
    private static final Set<String> DEFAULT_GIFT_OCCASIONS = Set.of(
        "birthday",
        "wedding",
        "anniversary",
        "housewarming",
        "festivals"
    );
    private static final List<String> DEFAULT_SUGGESTIONS = List.of(
        "Gift ideas",
        "Track order",
        "Best sellers",
        "Candle care"
    );
    private static final String STORE_EMAIL = "candleora25@gmail.com";
    private static final String STORE_PHONE = "8999908639";
    private static final String STORE_LOCATION = "Nagpur, Maharashtra, India";
    private static final String STORE_WHATSAPP = "https://wa.me/918999908639";
    private static final Set<String> STOP_WORDS = Set.of(
        "a", "about", "an", "and", "are", "can", "for", "from", "have", "help", "i", "im",
        "is", "it", "like", "me", "my", "need", "of", "on", "or", "our", "please", "show",
        "some", "the", "to", "want", "what", "with", "your"
    );
    private static final Pattern ORDER_ID_PATTERN = Pattern.compile(
        "(?:order(?:\\s*id)?|tracking(?:\\s*id)?|track(?:ing)?|#)\\s*[:#-]?\\s*(\\d{1,10})",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern STANDALONE_ORDER_ID_PATTERN = Pattern.compile("^\\s*(\\d{1,10})\\s*$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern BUDGET_PATTERN = Pattern.compile(
        "(?:under|below|less than|within|budget(?:\\s+of)?|cheap(?:er)?(?:\\s+than)?)\\s*(?:rs\\.?|inr|₹)?\\s*(\\d{2,5})",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d{2,5})");
    private static final Pattern TOKEN_SPLIT_PATTERN = Pattern.compile("[^a-z0-9]+");

    private final CatalogService catalogService;
    private final ContentService contentService;
    private final OrderService orderService;
    private final AuraAnalyticsService auraAnalyticsService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String openAiApiKey;
    private final String openAiBaseUrl;
    private final String openAiModel;

    public AuraChatService(
        CatalogService catalogService,
        ContentService contentService,
        OrderService orderService,
        AuraAnalyticsService auraAnalyticsService,
        ObjectMapper objectMapper,
        @Value("${app.openai.api-key:}") String openAiApiKey,
        @Value("${app.openai.base-url:https://api.openai.com}") String openAiBaseUrl,
        @Value("${app.openai.model:gpt-4o-mini}") String openAiModel
    ) {
        this.catalogService = catalogService;
        this.contentService = contentService;
        this.orderService = orderService;
        this.auraAnalyticsService = auraAnalyticsService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        this.openAiApiKey = openAiApiKey;
        this.openAiBaseUrl = openAiBaseUrl;
        this.openAiModel = openAiModel;
    }

    public AuraChatResponse chat(AppUser user, AuraChatRequest request) {
        String message = request.message() == null ? "" : request.message().trim();
        if (!StringUtils.hasText(message)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }

        AuraIntentProfile intent = detectIntent(message, request.history());
        AuraDraftReply draft = buildDraftReply(user, request, intent);
        boolean usedTrainingOverride = false;
        if (needsTrainingReview(draft)) {
            AuraAnalyticsService.TrainedReply trainedReply = auraAnalyticsService.findTrainedReply(message);
            if (trainedReply != null) {
                draft = new AuraDraftReply(
                    RESPONSE_TYPE_TEXT,
                    trainedReply.answer(),
                    trainedReply.answer(),
                    trainedReply.suggestions(),
                    "Trained Aura answer: " + trainedReply.sourceQuestion()
                );
                usedTrainingOverride = true;
            }
        }

        boolean usedOpenAi = !usedTrainingOverride && shouldUseOpenAi(intent, draft);
        AuraAssistantCopy copy = usedOpenAi
            ? generateAssistantCopy(request, intent, draft)
            : new AuraAssistantCopy(draft.fallbackMessage(), draft.suggestions());

        String polishedMessage = sanitizeAssistantMessage(copy.message(), draft.fallbackMessage());
        List<String> suggestions = sanitizeSuggestions(copy.suggestions(), draft.suggestions());
        Object data = RESPONSE_TYPE_TEXT.equals(draft.type()) ? polishedMessage : draft.data();
        boolean needsTrainingReview = !usedTrainingOverride && needsTrainingReview(draft);

        auraAnalyticsService.recordChatExchange(
            user,
            request,
            intent.describe(),
            draft.type(),
            polishedMessage,
            needsTrainingReview,
            usedOpenAi,
            usedTrainingOverride
        );

        return new AuraChatResponse(draft.type(), data, polishedMessage, suggestions, draft.actions());
    }

    private AuraDraftReply buildDraftReply(AppUser user, AuraChatRequest request, AuraIntentProfile intent) {
        if (intent.trackOrder()) {
            return buildOrderReply(user, intent);
        }

        if (intent.cartReview()) {
            return buildCartSnapshotReply(request.context());
        }

        if (intent.wishlistReview()) {
            return buildWishlistReply(request.context());
        }

        if (intent.cartUpsell()) {
            return buildCartUpsellReply(request.context());
        }

        if (intent.giftIdeas() || intent.budgetFocused() || intent.bestSellers() || intent.wantsRecommendation()) {
            return buildProductReply(intent);
        }

        if (intent.brandStory()) {
            return buildStoryReply();
        }

        if (intent.contactSupport()) {
            return buildContactReply();
        }

        CandleFixResponse fix = findRelevantFix(request.message());
        if (fix != null) {
            String fixMessage = "Try this candle care fix: " + fix.title() + ". " + fix.fixSteps().replace("\n", " ");
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                fixMessage,
                fixMessage,
                List.of("Candle care", "Gift ideas", "Best sellers"),
                "Matched candle care guide: " + fix.title()
            );
        }

        FaqResponse faq = findRelevantFaq(request.message());
        if (faq != null) {
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                faq.answer(),
                faq.answer(),
                List.of("Track order", "Gift ideas", "Best sellers"),
                "Matched FAQ: " + faq.question() + " -> " + faq.answer()
            );
        }

        if (intent.greeting()) {
            String welcome = "Hi, I'm Aura ✨ Looking for the perfect candle or need help with an order?";
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                welcome,
                welcome,
                List.of("Gift ideas", "Track order", "What's in my cart"),
                "Greeting detected"
            );
        }

        String generalReply =
            "I'm sorry, I couldn't find an exact CandleOra answer for that just yet. I can still help with gift ideas, cart or wishlist checks, order updates, CandleOra story details, and candle care.";
        return new AuraDraftReply(
            RESPONSE_TYPE_TEXT,
            generalReply,
            generalReply,
            List.of("Gift ideas", "Track order", "CandleOra story"),
            "General concierge reply"
        );
    }

    private AuraDraftReply buildOrderReply(AppUser user, AuraIntentProfile intent) {
        if (user != null) {
            OrderResponse order = resolveAuthenticatedOrder(user, intent.orderId());
            AuraOrderSummaryResponse summary = toOrderSummary(order, true);
            String message = intent.orderId() != null
                ? "I've pulled the latest CandleOra update for your order."
                : "Here's the latest CandleOra order activity on your account.";
            return new AuraDraftReply(
                RESPONSE_TYPE_ORDER,
                summary,
                message,
                List.of("Gift ideas", "Best sellers", "What's in my cart"),
                buildOrderContext(summary)
            );
        }

        if (intent.orderId() == null) {
            String message = "Share your order ID and I'll look up the latest status for you.";
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                message,
                message,
                List.of("Track order", "Gift ideas", "Best sellers"),
                "Guest order lookup requested without order id"
            );
        }

        if (!StringUtils.hasText(intent.orderEmail())) {
            String message =
                "I can track that order for you. Please share the billing email used at checkout along with the order ID.";
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                message,
                message,
                List.of("Track order", "Gift ideas", "Best sellers"),
                "Guest order lookup requested without billing email"
            );
        }

        OrderResponse order = orderService.getOrderForTracking(intent.orderId(), intent.orderEmail());
        AuraOrderSummaryResponse summary = toOrderSummary(order, false);
        String message = "I found a matching CandleOra order using that billing email.";
        return new AuraDraftReply(
            RESPONSE_TYPE_ORDER,
            summary,
            message,
            List.of("Gift ideas", "Best sellers", "What's in my cart"),
            buildOrderContext(summary)
        );
    }

    private OrderResponse resolveAuthenticatedOrder(AppUser user, Long orderId) {
        if (orderId != null) {
            return orderService.getOrder(user, orderId);
        }

        return orderService.getOrders(user)
            .stream()
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No orders found for this account"));
    }

    private AuraDraftReply buildCartSnapshotReply(AuraChatContext context) {
        AuraCollectionSummaryResponse summary = toCartSummary(context);
        boolean hasItems = summary.totalItems() != null && summary.totalItems() > 0;
        String message = hasItems
            ? "Here is your current CandleOra cart in one quick view."
            : "Your CandleOra cart is empty right now. I can pull a few beautiful options if you want to start fresh.";

        return new AuraDraftReply(
            RESPONSE_TYPE_CART,
            summary,
            message,
            hasItems
                ? List.of("Gift ideas", "Best sellers", "My wishlist")
                : List.of("Best sellers", "Gift ideas", "My wishlist"),
            buildCollectionContext("Cart snapshot", summary)
        );
    }

    private AuraDraftReply buildWishlistReply(AuraChatContext context) {
        AuraCollectionSummaryResponse summary = toWishlistSummary(context);
        boolean hasItems = summary.totalItems() != null && summary.totalItems() > 0;
        String message = hasItems
            ? "These are the CandleOra pieces you have saved so far."
            : "Your wishlist is empty at the moment. I can help you save a few gift-ready or best-selling candles next.";

        return new AuraDraftReply(
            RESPONSE_TYPE_WISHLIST,
            summary,
            message,
            hasItems
                ? List.of("Gift ideas", "What's in my cart", "Best sellers")
                : List.of("Best sellers", "Gift ideas", "What's in my cart"),
            buildCollectionContext("Wishlist snapshot", summary)
        );
    }

    private AuraDraftReply buildCartUpsellReply(AuraChatContext context) {
        List<ProductSummaryResponse> products = fetchCartUpsellProducts(context);
        if (!products.isEmpty()) {
            String message = hasCartItems(context)
                ? "Your cart already has a beautiful base. These additions keep the look refined without feeling excessive."
                : "Your cart is empty right now, so I pulled a few CandleOra favorites to begin with.";
            return new AuraDraftReply(
                RESPONSE_TYPE_PRODUCTS,
                products,
                message,
                List.of("What's in my cart", "Gift ideas", "Best sellers"),
                buildProductsContext("Cart-led recommendations", products)
            );
        }

        String message = "I can suggest pairings once you add something to cart, or I can show a few best sellers right away.";
        return new AuraDraftReply(
            RESPONSE_TYPE_TEXT,
            message,
            message,
            List.of("Best sellers", "Gift ideas", "What's in my cart"),
            "Cart upsell requested but no products available"
        );
    }

    private AuraDraftReply buildStoryReply() {
        String message =
            "CandleOra is built by artists and designers who create handmade candles for real moods, moments, and memories. Every piece is made to feel personal, warm, and gift-worthy.";
        return new AuraDraftReply(
            RESPONSE_TYPE_TEXT,
            message,
            message,
            List.of("Gift ideas", "Best sellers", "Contact support"),
            "CandleOra story: artists and designers, handmade candles, real moods, moments, memories, and meaningful gifting."
        );
    }

    private AuraDraftReply buildContactReply() {
        String message =
            "You can reach CandleOra on phone at "
                + STORE_PHONE
                + ", by email at "
                + STORE_EMAIL
                + ", or on WhatsApp at "
                + STORE_WHATSAPP
                + ". We are based in "
                + STORE_LOCATION
                + ".";
        return new AuraDraftReply(
            RESPONSE_TYPE_TEXT,
            message,
            message,
            List.of("Track order", "CandleOra story", "Gift ideas"),
            List.of(
                new AuraChatAction("Call CandleOra", "tel:+91" + STORE_PHONE),
                new AuraChatAction("Email CandleOra", "mailto:" + STORE_EMAIL),
                new AuraChatAction("WhatsApp CandleOra", STORE_WHATSAPP)
            ),
            "Support details: phone "
                + STORE_PHONE
                + ", email "
                + STORE_EMAIL
                + ", WhatsApp "
                + STORE_WHATSAPP
                + ", location "
                + STORE_LOCATION
        );
    }

    private AuraDraftReply buildProductReply(AuraIntentProfile intent) {
        List<ProductSummaryResponse> products;
        String contextLabel;
        String fallbackMessage;

        if (intent.bestSellers() && !intent.giftIdeas()) {
            products = fetchBestSellerProducts();
            contextLabel = "Best seller recommendations";
            fallbackMessage =
                "These are a few CandleOra favorites customers reach for when they want a refined, dependable pick.";
        } else if (intent.giftIdeas()) {
            products = fetchGiftProducts(intent);
            contextLabel = "Gift-led recommendations";
            fallbackMessage = "These CandleOra picks feel especially gift-ready and easy to style for the occasion.";
        } else if (intent.budgetFocused()) {
            products = fetchBudgetProducts(intent);
            contextLabel = "Budget-led recommendations";
            fallbackMessage = "These are some of the most budget-friendly CandleOra picks without losing the premium feel.";
        } else {
            products = fetchBestSellerProducts();
            contextLabel = "Best seller recommendations";
            fallbackMessage =
                "These are a few CandleOra favorites customers reach for when they want a refined, dependable pick.";
        }

        if (products.isEmpty()) {
            String message =
                "I'm not seeing a perfect match right now, but I can still guide you by occasion, scent family, or budget.";
            return new AuraDraftReply(
                RESPONSE_TYPE_TEXT,
                message,
                message,
                List.of("Gift ideas", "Best sellers", "Candle care"),
                contextLabel + " unavailable"
            );
        }

        return new AuraDraftReply(
            RESPONSE_TYPE_PRODUCTS,
            products,
            fallbackMessage,
            List.of("Track order", "Gift ideas", "Best sellers"),
            buildProductsContext(contextLabel, products)
        );
    }

    private AuraAssistantCopy generateAssistantCopy(
        AuraChatRequest request,
        AuraIntentProfile intent,
        AuraDraftReply draft
    ) {
        if (!StringUtils.hasText(openAiApiKey)) {
            return new AuraAssistantCopy(draft.fallbackMessage(), draft.suggestions());
        }

        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("model", openAiModel);
            ArrayNode input = payload.putArray("input");
            input.add(buildInputMessage("system", buildSystemPrompt()));
            input.add(buildInputMessage("user", buildUserPrompt(request, intent, draft)));

            ObjectNode text = payload.putObject("text");
            ObjectNode format = text.putObject("format");
            format.put("type", "json_schema");
            format.put("name", "aura_chat_copy");
            format.put("strict", true);
            format.set("schema", buildAssistantCopySchema());

            HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl(openAiBaseUrl) + "/v1/responses"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn("Aura OpenAI request failed with status {}: {}", response.statusCode(), response.body());
                return new AuraAssistantCopy(draft.fallbackMessage(), draft.suggestions());
            }

            String outputText = extractOutputText(objectMapper.readTree(response.body()));
            if (!StringUtils.hasText(outputText)) {
                return new AuraAssistantCopy(draft.fallbackMessage(), draft.suggestions());
            }

            return objectMapper.readValue(outputText, AuraAssistantCopy.class);
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.warn("Aura OpenAI fallback activated: {}", error.getMessage());
            return new AuraAssistantCopy(draft.fallbackMessage(), draft.suggestions());
        }
    }

    private boolean shouldUseOpenAi(AuraIntentProfile intent, AuraDraftReply draft) {
        if (!StringUtils.hasText(openAiApiKey)) {
            return false;
        }

        if (!RESPONSE_TYPE_TEXT.equals(draft.type())) {
            return false;
        }

        if (intent.trackOrder() || intent.cartReview() || intent.wishlistReview()) {
            return false;
        }

        if (intent.brandStory() || intent.contactSupport() || intent.candleCare()) {
            return false;
        }

        return !StringUtils.startsWithIgnoreCase(draft.contextSummary(), "Matched FAQ:");
    }

    private boolean needsTrainingReview(AuraDraftReply draft) {
        String summary = safeValue(draft.contextSummary(), "");
        return "General concierge reply".equals(summary) || summary.endsWith(" unavailable");
    }

    private String sanitizeAssistantMessage(String candidate, String fallback) {
        if (!StringUtils.hasText(candidate)) {
            return fallback;
        }

        String trimmed = candidate.trim();
        return looksLikeMetaCommentary(trimmed) ? fallback : trimmed;
    }

    private boolean looksLikeMetaCommentary(String message) {
        String normalized = normalize(message);
        return normalized.contains("next pass")
            || normalized.contains("if you want")
            || normalized.contains("i'd take")
            || normalized.contains("i can add")
            || normalized.contains("i can make")
            || normalized.contains("quick chips")
            || normalized.contains("ui can render");
    }

    private ObjectNode buildInputMessage(String role, String text) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", role);
        ArrayNode content = message.putArray("content");
        ObjectNode part = content.addObject();
        part.put("type", "input_text");
        part.put("text", text);
        return message;
    }

    private ObjectNode buildAssistantCopySchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.put("additionalProperties", false);

        ObjectNode properties = schema.putObject("properties");
        properties.putObject("message").put("type", "string");

        ObjectNode suggestions = properties.putObject("suggestions");
        suggestions.put("type", "array");
        suggestions.put("maxItems", 3);
        suggestions.putObject("items").put("type", "string");

        ArrayNode required = schema.putArray("required");
        required.add("message");
        required.add("suggestions");
        return schema;
    }

    private String buildSystemPrompt() {
        return """
            You are Aura, CandleOra's luxury AI concierge.
            Help with candle recommendations, gifting suggestions, order tracking, candle care, cart and wishlist reviews, and CandleOra story or support questions.

            Voice rules:
            - Premium, calm, elegant
            - Short, warm, and helpful
            - Slight emotional touch is welcome, but keep it restrained
            - Never sound robotic or overly salesy
            - Never mention internal implementation, future improvements, or product roadmap language

            Business rules:
            - Never invent products, prices, or order updates
            - Use only the store facts provided by CandleOra
            - If there are products, guide the customer toward purchase with a subtle upsell
            - If there is an order, explain the status clearly and calmly
            - Suggestions must be short chips the UI can render
            """;
    }

    private String buildUserPrompt(AuraChatRequest request, AuraIntentProfile intent, AuraDraftReply draft) {
        List<String> lines = new ArrayList<>();
        lines.add("Customer message: " + request.message().trim());
        lines.add("Detected intent: " + intent.describe());
        lines.add("Preferred response type: " + draft.type());

        if (request.context() != null) {
            lines.add("Page path: " + safeValue(request.context().pagePath(), "unknown"));
            lines.add("Signed in: " + Boolean.TRUE.equals(request.context().authenticated()));
            lines.add("Customer name: " + safeValue(request.context().customerName(), "guest"));
            lines.add("Cart summary: " + buildCartContext(request.context()));
            lines.add("Wishlist summary: " + buildWishlistContext(request.context()));
        }

        String history = buildConversationContext(request.history());
        if (StringUtils.hasText(history)) {
            lines.add("Recent conversation:");
            lines.add(history);
        }

        lines.add("Store facts:");
        lines.add(draft.contextSummary());
        lines.add("Fallback message to refine: " + draft.fallbackMessage());
        lines.add("Return JSON with `message` and `suggestions` only.");
        lines.add("Suggestions should be concise, relevant, and easy to tap.");
        return String.join("\n", lines);
    }

    private AuraIntentProfile detectIntent(String message, List<AuraChatMessage> history) {
        String normalizedMessage = normalize(message);
        String previousUserHistory = normalize(joinPreviousUserMessages(history, message));
        Long currentOrderId = findOrderId(normalizedMessage);
        String currentEmail = findEmail(normalizedMessage);

        boolean trackOrderRequestedInCurrentMessage = isTrackOrderRequest(normalizedMessage);
        boolean continuingTrackOrderFlow =
            !trackOrderRequestedInCurrentMessage
                && (currentOrderId != null || StringUtils.hasText(currentEmail))
                && isTrackOrderRequest(previousUserHistory);

        boolean trackOrder = trackOrderRequestedInCurrentMessage || continuingTrackOrderFlow;
        Long resolvedOrderId = currentOrderId;
        String resolvedOrderEmail = currentEmail;

        if (continuingTrackOrderFlow) {
            if (resolvedOrderId == null) {
                resolvedOrderId = findOrderId(previousUserHistory);
            }

            if (!StringUtils.hasText(resolvedOrderEmail)) {
                resolvedOrderEmail = findEmail(previousUserHistory);
            }
        }

        boolean directBestSellerRequest = isDirectIntentRequest(normalizedMessage, "best sellers", "bestsellers", "best seller");
        boolean giftIdeas =
            !directBestSellerRequest
                && containsAny(normalizedMessage, "gift", "birthday", "wedding", "anniversary", "housewarming", "festival");
        boolean budgetFocused = containsAny(normalizedMessage, "cheap", "budget", "under", "below", "less than", "affordable");
        boolean cartReview = containsAny(normalizedMessage, "cart summary", "my cart", "cart", "basket");
        boolean wishlistReview = containsAny(normalizedMessage, "wishlist", "saved candles", "saved");
        boolean cartUpsell =
            !cartReview
                && containsAny(normalizedMessage, "checkout", "add on", "pair with", "pairing", "go with my cart", "what goes with");
        boolean bestSellers = directBestSellerRequest
            || containsAny(normalizedMessage, "best seller", "bestsellers", "best sellers", "popular", "trending");
        boolean candleCare = containsAny(normalizedMessage, "wick", "burn", "tunnel", "tunneling", "mushroom", "candle care", "care");
        boolean wantsRecommendation = containsAny(normalizedMessage, "recommend", "suggest", "which candle", "what candle", "show me");
        boolean brandStory = containsAny(normalizedMessage, "candleora story", "brand story", "our story", "about candleora", "who are you");
        boolean contactSupport = containsAny(
            normalizedMessage,
            "contact",
            "support",
            "phone",
            "email",
            "whatsapp",
            "location",
            "custom candles",
            "bulk order"
        );
        boolean greeting = normalizedMessage.matches(".*\\b(hi|hello|hey)\\b.*") && normalizedMessage.split("\\s+").length <= 6;

        return new AuraIntentProfile(
            trackOrder,
            giftIdeas,
            budgetFocused,
            cartReview,
            wishlistReview,
            cartUpsell,
            bestSellers,
            candleCare,
            wantsRecommendation,
            brandStory,
            contactSupport,
            greeting,
            extractOccasions(normalizedMessage),
            extractBudget(normalizedMessage),
            resolvedOrderId,
            resolvedOrderEmail
        );
    }

    private List<String> sanitizeSuggestions(List<String> aiSuggestions, List<String> fallbackSuggestions) {
        LinkedHashSet<String> suggestions = new LinkedHashSet<>();

        safeStrings(aiSuggestions).stream()
            .filter(StringUtils::hasText)
            .map(String::trim)
            .forEach(suggestions::add);

        safeStrings(fallbackSuggestions).stream()
            .filter(StringUtils::hasText)
            .map(String::trim)
            .forEach(suggestions::add);

        DEFAULT_SUGGESTIONS.forEach(suggestions::add);
        return suggestions.stream().limit(3).toList();
    }

    private String buildCartContext(AuraChatContext context) {
        List<AuraChatCartItem> cartItems = safeCartItems(context);
        if (cartItems.isEmpty()) {
            return "empty";
        }

        return cartItems.stream()
            .limit(3)
            .map(item -> safeValue(item.productName(), "Product") + " x" + safeNumber(item.quantity()))
            .collect(Collectors.joining(", "));
    }

    private String buildWishlistContext(AuraChatContext context) {
        List<AuraChatWishlistItem> wishlistItems = safeWishlistItems(context);
        if (wishlistItems.isEmpty()) {
            return "empty";
        }

        return wishlistItems.stream()
            .limit(3)
            .map(item -> safeValue(item.productName(), "Candle"))
            .collect(Collectors.joining(", "));
    }

    private String buildCollectionContext(String label, AuraCollectionSummaryResponse summary) {
        if (summary.items() == null || summary.items().isEmpty()) {
            return label + ": empty";
        }

        String items = summary.items().stream()
            .map(item -> safeValue(item.productName(), "Candle") + (item.quantity() == null ? "" : " x" + item.quantity()))
            .collect(Collectors.joining("; "));
        return label
            + ": "
            + safeNumber(summary.totalItems())
            + " items, "
            + (summary.totalAmount() == null ? "unknown total" : "Rs. " + summary.totalAmount().intValue())
            + " -> "
            + items;
    }

    private String buildConversationContext(List<AuraChatMessage> history) {
        List<AuraChatMessage> safeHistory = safeHistory(history);
        int startIndex = Math.max(safeHistory.size() - 6, 0);

        return safeHistory.subList(startIndex, safeHistory.size()).stream()
            .filter(message -> StringUtils.hasText(message.content()))
            .map(message -> safeValue(message.role(), "user") + ": " + message.content().trim())
            .collect(Collectors.joining("\n"));
    }

    private String buildProductsContext(String label, List<ProductSummaryResponse> products) {
        if (products.isEmpty()) {
            return label + ": none";
        }

        return label + ": " + products.stream()
            .map(product -> product.name()
                + " (Rs. " + product.price().intValue()
                + ", " + safeValue(product.occasionTag(), "Everyday")
                + ")")
            .collect(Collectors.joining("; "));
    }

    private String buildOrderContext(AuraOrderSummaryResponse order) {
        return "Order #"
            + order.id()
            + " status "
            + order.status()
            + ", payment "
            + order.paymentStatus()
            + ", ETA "
            + safeValue(order.estimatedDeliveryStart(), "soon")
            + " to "
            + safeValue(order.estimatedDeliveryEnd(), "soon")
            + ", items "
            + safeNumber(order.itemCount());
    }

    private Set<String> tokenize(String value) {
        return TOKEN_SPLIT_PATTERN.splitAsStream(normalize(value))
            .filter(token -> token.length() > 2)
            .filter(token -> !STOP_WORDS.contains(token))
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private int overlapScore(Set<String> messageTokens, String candidate) {
        if (messageTokens.isEmpty() || !StringUtils.hasText(candidate)) {
            return 0;
        }

        Set<String> candidateTokens = tokenize(candidate);
        int score = 0;
        for (String token : messageTokens) {
            if (candidateTokens.contains(token)) {
                score++;
            }
        }
        return score;
    }

    private Set<String> extractOccasions(String value) {
        Set<String> occasions = new LinkedHashSet<>();
        if (value.contains("birthday")) {
            occasions.add("birthday");
        }
        if (value.contains("wedding") || value.contains("bridal")) {
            occasions.add("wedding");
        }
        if (value.contains("anniversary")) {
            occasions.add("anniversary");
        }
        if (value.contains("housewarming")) {
            occasions.add("housewarming");
        }
        if (value.contains("festival") || value.contains("festive")) {
            occasions.add("festivals");
        }
        return occasions;
    }

    private BigDecimal extractBudget(String combined) {
        Matcher matcher = BUDGET_PATTERN.matcher(combined);
        if (matcher.find()) {
            return BigDecimal.valueOf(Long.parseLong(matcher.group(1)));
        }

        if (combined.contains("cheap") || combined.contains("budget") || combined.contains("affordable")) {
            Matcher numberMatcher = NUMBER_PATTERN.matcher(combined);
            if (numberMatcher.find()) {
                return BigDecimal.valueOf(Long.parseLong(numberMatcher.group(1)));
            }
            return BigDecimal.valueOf(800);
        }

        return null;
    }

    private Long findOrderId(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        Matcher matcher = ORDER_ID_PATTERN.matcher(value);
        if (matcher.find()) {
            return Long.parseLong(matcher.group(1));
        }

        Matcher standaloneMatcher = STANDALONE_ORDER_ID_PATTERN.matcher(value);
        return standaloneMatcher.matches() ? Long.parseLong(standaloneMatcher.group(1)) : null;
    }

    private String findEmail(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        Matcher matcher = EMAIL_PATTERN.matcher(value);
        return matcher.find() ? matcher.group().toLowerCase(Locale.ROOT) : null;
    }

    private boolean isTrackOrderRequest(String normalizedMessage) {
        return containsAny(
            normalizedMessage,
            "track order",
            "order status",
            "where is my order",
            "track my order",
            "my order",
            "order update",
            "what did i order",
            "what have i ordered",
            "my last order"
        ) || (normalizedMessage.contains("delivery") && normalizedMessage.contains("order"));
    }

    private boolean isDirectIntentRequest(String normalizedMessage, String... values) {
        String compactMessage = normalize(normalizedMessage).replaceAll("\\s+", " ").trim();
        for (String value : values) {
            String candidate = normalize(value).replaceAll("\\s+", " ").trim();
            if (compactMessage.equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    private String joinPreviousUserMessages(List<AuraChatMessage> history, String currentMessage) {
        List<String> userMessages = safeHistory(history).stream()
            .filter(message -> "user".equalsIgnoreCase(safeValue(message.role(), "")))
            .map(message -> safeValue(message.content(), ""))
            .toList();

        if (userMessages.isEmpty()) {
            return "";
        }

        int lastIndex = userMessages.size() - 1;
        if (normalize(userMessages.get(lastIndex)).equals(normalize(currentMessage))) {
            return String.join(" ", userMessages.subList(0, lastIndex));
        }

        return String.join(" ", userMessages);
    }

    private List<String> safeStrings(List<String> values) {
        return values == null ? List.of() : values;
    }

    private List<AuraChatMessage> safeHistory(List<AuraChatMessage> history) {
        return history == null ? List.of() : history;
    }

    private List<AuraChatCartItem> safeCartItems(AuraChatContext context) {
        return context == null || context.cartItems() == null ? List.of() : context.cartItems();
    }

    private List<AuraChatWishlistItem> safeWishlistItems(AuraChatContext context) {
        return context == null || context.wishlistItems() == null ? List.of() : context.wishlistItems();
    }

    private boolean hasCartItems(AuraChatContext context) {
        return !safeCartItems(context).isEmpty();
    }

    private boolean containsAny(String text, String... values) {
        String normalizedText = normalize(text);
        for (String value : values) {
            if (normalizedText.contains(normalize(value))) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.toLowerCase(Locale.ROOT).trim();
        normalized = normalized.replace("candle ora", "candleora");
        normalized = normalized.replace("best sellers", "bestsellers");
        normalized = normalized.replace("best seller", "bestseller");
        normalized = normalized.replace("burn time", "burntime");
        normalized = normalized.replace("how long do", "burntime");
        normalized = normalized.replace("how long will", "burntime");
        normalized = normalized.replace("lasting", "burntime");
        normalized = normalized.replace("scented", "scent");
        normalized = normalized.replace("scents", "scent");
        normalized = normalized.replace("fragrance", "scent");
        normalized = normalized.replace("fragrances", "scent");
        normalized = normalized.replace("aroma", "scent");
        normalized = normalized.replace("smell", "scent");
        normalized = normalized.replace("favourites", "wishlist");
        normalized = normalized.replace("favorites", "wishlist");
        normalized = normalized.replace("saved for later", "wishlist");
        normalized = normalized.replace("saved items", "wishlist");
        normalized = normalized.replace("what's in my cart", "cart summary");
        normalized = normalized.replace("what is in my cart", "cart summary");
        normalized = normalized.replace("phone number", "phone");
        normalized = normalized.replace("email address", "email");
        normalized = normalized.replace("how can i contact you", "contact support");
        normalized = normalized.replace("how do i contact you", "contact support");
        normalized = normalized.replace("how can i reach you", "contact support");
        normalized = normalized.replace("tell me about candleora", "candleora story");
        normalized = normalized.replace("about candleora", "candleora story");
        normalized = normalized.replace("who are you", "candleora story");
        normalized = normalized.replace("who we are", "candleora story");
        normalized = normalized.replace("brand story", "candleora story");
        normalized = normalized.replace("our story", "candleora story");
        normalized = normalized.replace("what did i order", "track order");
        normalized = normalized.replace("what have i ordered", "track order");
        normalized = normalized.replace("where is my order", "track order");
        normalized = normalized.replace("order updates", "track order");
        normalized = normalized.replace("order update", "track order");
        normalized = normalized.replace("my last order", "track order");
        normalized = normalized.replace("house warming", "housewarming");
        normalized = normalized.replace("gifting", "gift");
        normalized = normalized.replace("presents", "gift");
        return normalized;
    }

    private String safeValue(Object value, String fallback) {
        return value == null ? fallback : String.valueOf(value);
    }

    private int safeNumber(Integer value) {
        return value == null ? 0 : value;
    }

    private AuraOrderSummaryResponse toOrderSummary(OrderResponse order, boolean canViewDetails) {
        String reference = firstNonBlank(
            order.gatewayOrderId(),
            order.gatewayPaymentId(),
            order.invoiceNumber(),
            order.id() == null ? null : String.valueOf(order.id())
        );
        List<AuraOrderItemSummaryResponse> items = safeOrderItems(order).stream()
            .map(this::toOrderItemSummary)
            .toList();
        int itemCount = safeOrderItems(order).stream()
            .map(OrderItemResponse::quantity)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();

        return new AuraOrderSummaryResponse(
            order.id(),
            order.status(),
            order.paymentStatus(),
            order.totalAmount(),
            order.shippingName(),
            order.contactEmail(),
            order.estimatedDeliveryStart(),
            order.estimatedDeliveryEnd(),
            reference,
            order.invoiceNumber(),
            canViewDetails,
            StringUtils.hasText(order.invoiceNumber())
                && (canViewDetails || StringUtils.hasText(order.contactEmail())),
            itemCount,
            items
        );
    }

    private AuraOrderItemSummaryResponse toOrderItemSummary(OrderItemResponse item) {
        BigDecimal unitPrice = item.price() == null ? BigDecimal.ZERO : item.price();
        int quantity = item.quantity() == null ? 0 : item.quantity();

        return new AuraOrderItemSummaryResponse(
            item.productId(),
            item.productName(),
            item.imageUrl(),
            item.quantity(),
            unitPrice,
            unitPrice.multiply(BigDecimal.valueOf(quantity))
        );
    }

    private List<OrderItemResponse> safeOrderItems(OrderResponse order) {
        return order == null || order.items() == null ? List.of() : order.items();
    }

    private AuraCollectionSummaryResponse toCartSummary(AuraChatContext context) {
        List<AuraChatCartItem> cartItems = safeCartItems(context);
        int totalItems = cartItems.stream()
            .map(AuraChatCartItem::quantity)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();
        BigDecimal totalAmount = firstNonNull(
            context == null ? null : context.cartTotal(),
            cartItems.stream()
                .map(item -> firstNonNull(item.lineTotal(), item.unitPrice()))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );

        return new AuraCollectionSummaryResponse(
            totalItems > 0 ? "Your current cart" : "Your cart is empty",
            totalItems > 0 ? "View cart" : "Explore shop",
            totalItems > 0 ? "/cart" : "/shop",
            totalItems,
            totalAmount,
            cartItems.stream()
                .limit(3)
                .map(item -> new AuraCollectionItemResponse(
                    item.productId(),
                    item.slug(),
                    item.productName(),
                    item.imageUrl(),
                    item.occasionTag(),
                    item.quantity(),
                    item.unitPrice(),
                    firstNonNull(item.lineTotal(), item.unitPrice())
                ))
                .toList()
        );
    }

    private AuraCollectionSummaryResponse toWishlistSummary(AuraChatContext context) {
        List<AuraChatWishlistItem> wishlistItems = safeWishlistItems(context);
        BigDecimal totalAmount = wishlistItems.stream()
            .map(AuraChatWishlistItem::price)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AuraCollectionSummaryResponse(
            wishlistItems.isEmpty() ? "Your wishlist is empty" : "Your saved candles",
            wishlistItems.isEmpty() ? "Explore shop" : "View wishlist",
            wishlistItems.isEmpty() ? "/shop" : "/wishlist",
            wishlistItems.size(),
            totalAmount,
            wishlistItems.stream()
                .limit(3)
                .map(item -> new AuraCollectionItemResponse(
                    item.productId(),
                    item.slug(),
                    item.productName(),
                    item.imageUrl(),
                    item.occasionTag(),
                    null,
                    item.price(),
                    item.price()
                ))
                .toList()
        );
    }

    private String normalizeBaseUrl(String baseUrl) {
        String resolved = baseUrl == null ? "https://api.openai.com" : baseUrl.trim();
        return resolved.endsWith("/") ? resolved.substring(0, resolved.length() - 1) : resolved;
    }

    private String extractOutputText(JsonNode body) {
        JsonNode directText = body.path("output_text");
        if (directText.isTextual()) {
            return directText.asText();
        }

        JsonNode output = body.path("output");
        if (!output.isArray()) {
            return null;
        }

        for (JsonNode item : output) {
            JsonNode content = item.path("content");
            if (!content.isArray()) {
                continue;
            }

            for (JsonNode part : content) {
                if ("output_text".equals(part.path("type").asText()) && part.path("text").isTextual()) {
                    return part.path("text").asText();
                }
            }
        }

        return null;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }

        return null;
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        if (values == null) {
            return null;
        }

        for (T value : values) {
            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private List<ProductSummaryResponse> fetchGiftProducts(AuraIntentProfile intent) {
        Set<String> occasions = !intent.occasions().isEmpty() ? intent.occasions() : DEFAULT_GIFT_OCCASIONS;
        List<ProductSummaryResponse> products = catalogService.getProducts(
                null,
                null,
                null,
                intent.maxBudget(),
                null,
                String.join(",", occasions),
                "popular",
                0,
                6
            )
            .content();

        return products.isEmpty() ? fetchBestSellerProducts() : products.stream().limit(3).toList();
    }

    private List<ProductSummaryResponse> fetchBudgetProducts(AuraIntentProfile intent) {
        BigDecimal maxBudget = intent.maxBudget() != null ? intent.maxBudget() : BigDecimal.valueOf(800);
        List<ProductSummaryResponse> products = catalogService.getProducts(
                null,
                null,
                null,
                maxBudget,
                null,
                intent.occasions().isEmpty() ? null : String.join(",", intent.occasions()),
                "price-asc",
                0,
                6
            )
            .content();

        if (!products.isEmpty()) {
            return products.stream().limit(3).toList();
        }

        return catalogService.getProducts(null, null, null, null, null, null, "price-asc", 0, 3).content();
    }

    private List<ProductSummaryResponse> fetchBestSellerProducts() {
        return catalogService.getProducts(null, null, null, null, null, null, "popular", 0, 3).content();
    }

    private List<ProductSummaryResponse> fetchCartUpsellProducts(AuraChatContext context) {
        Set<Long> cartProductIds = safeCartItems(context).stream()
            .map(AuraChatCartItem::productId)
            .filter(Objects::nonNull)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        if (!cartProductIds.isEmpty()) {
            Long baseProductId = cartProductIds.iterator().next();
            List<ProductSummaryResponse> related = catalogService.getRelatedProducts(String.valueOf(baseProductId))
                .stream()
                .filter(product -> !cartProductIds.contains(product.id()))
                .limit(3)
                .toList();
            if (!related.isEmpty()) {
                return related;
            }
        }

        return fetchBestSellerProducts().stream()
            .filter(product -> !cartProductIds.contains(product.id()))
            .limit(3)
            .toList();
    }

    private String buildProductFallbackMessage(AuraIntentProfile intent) {
        if (intent.giftIdeas() && intent.budgetFocused() && intent.maxBudget() != null) {
            return "These picks keep the gifting mood elevated while staying close to your budget.";
        }
        if (intent.giftIdeas()) {
            return "These CandleOra picks feel especially gift-ready and easy to style for the occasion.";
        }
        if (intent.budgetFocused()) {
            return "These are some of the most budget-friendly CandleOra picks without losing the premium feel.";
        }
        return "These are a few CandleOra favorites customers reach for when they want a refined, dependable pick.";
    }

    private FaqResponse findRelevantFaq(String message) {
        Set<String> messageTokens = tokenize(message);
        return contentService.getFaqs().stream()
            .map(faq -> new ScoredFaq(faq, overlapScore(messageTokens, buildFaqMatchingText(faq))))
            .filter(scored -> scored.score() > 0)
            .sorted((left, right) -> Integer.compare(right.score(), left.score()))
            .map(ScoredFaq::faq)
            .findFirst()
            .orElse(null);
    }

    private String buildFaqMatchingText(FaqResponse faq) {
        String question = normalize(faq.question());

        if (question.contains("special")) {
            return faq.question() + " " + faq.answer() + " premium unique quality mood ambiance";
        }
        if (question.contains("scents")) {
            return faq.question() + " " + faq.answer() + " scent fragrance aroma smell scented";
        }
        if (question.contains("burn")) {
            return faq.question() + " " + faq.answer() + " burntime lasting hours long";
        }
        if (question.contains("safe")) {
            return faq.question() + " " + faq.answer() + " safe indoor home inside";
        }
        if (question.contains("gift")) {
            return faq.question() + " " + faq.answer() + " gift present birthday wedding anniversary housewarming festivals";
        }
        if (question.contains("wick")) {
            return faq.question() + " " + faq.answer() + " wick trim flame mushroom candle care";
        }
        if (question.contains("store")) {
            return faq.question() + " " + faq.answer() + " store sunlight heat keep preserve fragrance";
        }
        if (question.contains("order")) {
            return faq.question() + " " + faq.answer() + " track order checkout invoice email updates";
        }

        return faq.question() + " " + faq.answer();
    }

    private CandleFixResponse findRelevantFix(String message) {
        Set<String> messageTokens = tokenize(message);
        return contentService.getFixes().stream()
            .map(fix -> new ScoredFix(fix, overlapScore(messageTokens, fix.title() + " " + fix.cause())))
            .filter(scored -> scored.score() > 0)
            .sorted((left, right) -> Integer.compare(right.score(), left.score()))
            .map(ScoredFix::fix)
            .findFirst()
            .orElse(null);
    }

    private record AuraIntentProfile(
        boolean trackOrder,
        boolean giftIdeas,
        boolean budgetFocused,
        boolean cartReview,
        boolean wishlistReview,
        boolean cartUpsell,
        boolean bestSellers,
        boolean candleCare,
        boolean wantsRecommendation,
        boolean brandStory,
        boolean contactSupport,
        boolean greeting,
        Set<String> occasions,
        BigDecimal maxBudget,
        Long orderId,
        String orderEmail
    ) {
        private String describe() {
            List<String> parts = new ArrayList<>();
            if (trackOrder) {
                parts.add("order_tracking");
            }
            if (giftIdeas) {
                parts.add("gift");
            }
            if (budgetFocused) {
                parts.add("budget");
            }
            if (cartReview) {
                parts.add("cart_review");
            }
            if (wishlistReview) {
                parts.add("wishlist_review");
            }
            if (cartUpsell) {
                parts.add("cart_upsell");
            }
            if (bestSellers) {
                parts.add("best_sellers");
            }
            if (candleCare) {
                parts.add("candle_care");
            }
            if (wantsRecommendation) {
                parts.add("recommendation");
            }
            if (brandStory) {
                parts.add("brand_story");
            }
            if (contactSupport) {
                parts.add("contact_support");
            }
            if (greeting) {
                parts.add("greeting");
            }
            return parts.isEmpty() ? "general" : String.join(", ", parts);
        }
    }

    private record AuraDraftReply(
        String type,
        Object data,
        String fallbackMessage,
        List<String> suggestions,
        List<AuraChatAction> actions,
        String contextSummary
    ) {
        private AuraDraftReply(
            String type,
            Object data,
            String fallbackMessage,
            List<String> suggestions,
            String contextSummary
        ) {
            this(type, data, fallbackMessage, suggestions, List.of(), contextSummary);
        }
    }

    private record AuraAssistantCopy(String message, List<String> suggestions) {
    }

    private record ScoredFaq(FaqResponse faq, int score) {
    }

    private record ScoredFix(CandleFixResponse fix, int score) {
    }
}
