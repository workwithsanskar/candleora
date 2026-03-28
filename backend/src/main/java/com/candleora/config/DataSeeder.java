package com.candleora.config;

import com.candleora.entity.AppUser;
import com.candleora.entity.AuthProvider;
import com.candleora.entity.CandleFix;
import com.candleora.entity.Category;
import com.candleora.entity.Faq;
import com.candleora.entity.Product;
import com.candleora.entity.Role;
import com.candleora.entity.StylingGuide;
import com.candleora.repository.AppUserRepository;
import com.candleora.repository.CandleFixRepository;
import com.candleora.repository.CategoryRepository;
import com.candleora.repository.FaqRepository;
import com.candleora.repository.ProductRepository;
import com.candleora.repository.StylingGuideRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CandleFixRepository candleFixRepository;
    private final StylingGuideRepository stylingGuideRepository;
    private final FaqRepository faqRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        CandleFixRepository candleFixRepository,
        StylingGuideRepository stylingGuideRepository,
        FaqRepository faqRepository,
        AppUserRepository appUserRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.candleFixRepository = candleFixRepository;
        this.stylingGuideRepository = stylingGuideRepository;
        this.faqRepository = faqRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedCategories();
        seedProducts();
        seedContent();
        seedUsers();
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) {
            return;
        }

        categoryRepository.saveAll(List.of(
            category("Flower", "flower"),
            category("Holder", "holder"),
            category("Glass", "glass"),
            category("Candle Sets", "candle-sets"),
            category("Tea Light", "tea-light"),
            category("Textured", "textured")
        ));
    }

    private void seedProducts() {
        if (productRepository.count() > 0) {
            return;
        }

        Map<String, Category> categories = categoryRepository.findAll().stream()
            .collect(Collectors.toMap(Category::getSlug, Function.identity()));

        productRepository.saveAll(List.of(
            product(
                "Lavender Ember Jar",
                "lavender-ember-jar",
                "A calming lavender and cedar candle poured in a frosted glass vessel for evening wind-down rituals.",
                799,
                899,
                12,
                18,
                "Self-care",
                4.9,
                "Lavender, cedarwood, soft musk",
                "40-48 hours",
                categories.get("glass"),
                List.of(
                    "https://images.unsplash.com/photo-1602874801006-e26c327f2f17?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Rose Petal Bloom",
                "rose-petal-bloom",
                "Romantic rose wax sculpture with a delicate floral scent designed for gifting and table styling.",
                949,
                1050,
                10,
                12,
                "Wedding",
                4.8,
                "Rose, peony, white amber",
                "30-36 hours",
                categories.get("flower"),
                List.of(
                    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Textured Sandstone Pillar",
                "textured-sandstone-pillar",
                "A warm neutral pillar candle with sculpted texture that anchors coffee tables, consoles, and shelves.",
                689,
                749,
                8,
                25,
                "Housewarming",
                4.7,
                "Vanilla bean, sandalwood, warm resin",
                "35-42 hours",
                categories.get("textured"),
                List.of(
                    "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Golden Aura Holder Set",
                "golden-aura-holder-set",
                "Two candle holders paired with matching mini pours for ready-to-style gifting.",
                1299,
                1499,
                15,
                9,
                "Birthday",
                4.9,
                "Warm amber, vanilla orchid, cashmere",
                "24-30 hours each",
                categories.get("candle-sets"),
                List.of(
                    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1602874801006-e26c327f2f17?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Tea Light Celebration Pack",
                "tea-light-celebration-pack",
                "Twelve tea lights in vanilla amber for intimate dinners, festive corners, and quick decor refreshes.",
                499,
                549,
                6,
                30,
                "Festivals",
                4.6,
                "Vanilla amber, clove, soft caramel",
                "6-8 hours each",
                categories.get("tea-light"),
                List.of(
                    "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Sculpted Marble Holder",
                "sculpted-marble-holder",
                "A marble-look candle holder that elevates side tables and wedding centerpieces.",
                899,
                989,
                9,
                14,
                "Anniversary",
                4.7,
                "Unscented styling accent",
                "Pairs with standard pillar candles",
                categories.get("holder"),
                List.of(
                    "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Vanilla Hearth Glass",
                "vanilla-hearth-glass",
                "Creamy vanilla and sandalwood with a soft amber throw, ideal for living rooms and reading nooks.",
                849,
                949,
                11,
                20,
                "Self-care",
                4.8,
                "Vanilla, sandalwood, amber",
                "42-50 hours",
                categories.get("glass"),
                List.of(
                    "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1602874801006-e26c327f2f17?auto=format&fit=crop&w=900&q=80"
                )
            ),
            product(
                "Garden Bloom Trio",
                "garden-bloom-trio",
                "A set of three petite floral candles for gifting baskets, bridal hampers, and vanity styling.",
                1099,
                1265,
                13,
                11,
                "Wedding",
                4.9,
                "Gardenia, rosewater, white musk",
                "18-22 hours each",
                categories.get("flower"),
                List.of(
                    "https://images.unsplash.com/photo-1602874801006-e26c327f2f17?auto=format&fit=crop&w=900&q=80",
                    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80"
                )
            )
        ));
    }

    private void seedContent() {
        if (candleFixRepository.count() == 0) {
            candleFixRepository.saveAll(List.of(
                candleFix(
                    "Candle Stops Burning in the Middle",
                    "Wick might be buried in wax or too short.",
                    """
                    1. Extinguish the candle and let it cool completely.
                    2. Use a spoon or wick tool to gently remove wax around the wick.
                    3. Trim the wick to about 1/2 inch and relight.
                    """
                ),
                candleFix(
                    "Uneven Burning or Tunneling",
                    "Wick not centered or not burning long enough on first use.",
                    """
                    1. On the next burn, allow the wax to melt all the way to the edges.
                    2. If tunneling is already there, use a foil wrap around the candle rim to help even it out.
                    """
                ),
                candleFix(
                    "Low Flame or Weak Scent Throw",
                    "Wick trimmed too short or fragrance is not dispersing well.",
                    """
                    1. Gently pour out a little melted wax or scoop it with a spoon.
                    2. Relight to let the wick breathe and the flame grow.
                    """
                ),
                candleFix(
                    "Mushrooming Wick",
                    "Wick is too long or has carbon build-up.",
                    """
                    1. Extinguish the candle.
                    2. Trim the mushroomed tip before relighting.
                    """
                )
            ));
        }

        if (stylingGuideRepository.count() == 0) {
            stylingGuideRepository.saveAll(List.of(
                stylingGuide(
                    "Entryway Glow",
                    "entryway-glow",
                    "Create a welcoming vignette with one tall candle, one tray, and a soft neutral accent.",
                    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80",
                    """
                    1. Start with a tray or narrow console base to frame the arrangement.
                    2. Add one tall statement candle and balance it with a smaller object like a ceramic dish.
                    3. Keep the palette limited to warm neutrals so the candle remains the focal point.
                    4. Finish with a subtle texture layer such as linen, wood, or stone.
                    """
                ),
                stylingGuide(
                    "Bedside Calm",
                    "bedside-calm",
                    "Use soft forms and low-height candles to create a quiet nighttime corner.",
                    "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=900&q=80",
                    """
                    1. Choose candles with softer scents and compact vessels for bedside use.
                    2. Pair the candle with one book stack and a small floral stem.
                    3. Avoid overcrowding so the setup feels intentional and easy to maintain.
                    4. Keep the palette warm and matte to support a restful mood.
                    """
                ),
                stylingGuide(
                    "Dinner Table Layering",
                    "dinner-table-layering",
                    "Mix tea lights and holders at varying heights for a warm, celebratory tablescape.",
                    "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
                    """
                    1. Start with tea lights for a low ambient glow across the table.
                    2. Add one or two elevated holders to create vertical rhythm.
                    3. Keep centerpieces narrow so conversation lines stay open.
                    4. Repeat materials or finishes to make the arrangement feel cohesive.
                    """
                )
            ));
        }

        if (faqRepository.count() == 0) {
            faqRepository.saveAll(List.of(
                faq(
                    "What makes CandleOra candles special?",
                    "Our candles are handmade with love, tested for quality and burn performance, and designed to enhance your mood, freshen your space, and create a calming ambiance.",
                    1
                ),
                faq(
                    "Do CandleOra candles have scents?",
                    "Yes. Each candle is infused with carefully selected fragrances that match its mood, occasion, or styling intention.",
                    2
                ),
                faq(
                    "How long do your candles burn?",
                    "Depending on the size and design, our candles can burn anywhere from 20 to 60 hours without losing fragrance or quality.",
                    3
                ),
                faq(
                    "Are your candles safe for indoor use?",
                    "Yes. Our candles are made with safe, high-quality wax and wicks. Always place them on a heat-resistant surface and never leave them unattended while lit.",
                    4
                ),
                faq(
                    "Can I gift CandleOra candles for special occasions?",
                    "Absolutely. Our occasion edits are designed for birthdays, weddings, anniversaries, festivals, housewarmings, and thoughtful self-care gifting.",
                    5
                ),
                faq(
                    "How should I care for the wick?",
                    "Trim the wick to about 1/4 inch before each burn for a cleaner flame and more even wax melt.",
                    6
                ),
                faq(
                    "How should I store my candles?",
                    "Keep them in a cool, dry place away from direct sunlight and heat so the wax shape, color, and fragrance stay intact.",
                    7
                ),
                faq(
                    "Do you share order updates after checkout?",
                    "Yes. You can review order details in your account, and the checkout email is used for order confirmation and invoice communication.",
                    8
                )
            ));
        }
    }

    private void seedUsers() {
        ensureUserExists("Demo Customer", "demo@candleora.com", Role.USER);
        ensureUserExists("CandleOra Admin", "admin@candleora.com", Role.ADMIN);
    }


    private void ensureUserExists(String name, String email, Role role) {
        if (appUserRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }

        appUserRepository.save(user(name, email, role));
    }

    private Category category(String name, String slug) {
        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        return category;
    }

    private Product product(
        String name,
        String slug,
        String description,
        double price,
        double originalPrice,
        int discount,
        int stock,
        String occasionTag,
        double rating,
        String scentNotes,
        String burnTime,
        Category category,
        List<String> imageUrls
    ) {
        Product product = new Product();
        product.setName(name);
        product.setSlug(slug);
        product.setDescription(description);
        product.setPrice(BigDecimal.valueOf(price));
        product.setOriginalPrice(BigDecimal.valueOf(originalPrice));
        product.setCostPrice(BigDecimal.valueOf(price).multiply(BigDecimal.valueOf(0.58)));
        product.setDiscount(discount);
        product.setSku(("CORA-" + slug).toUpperCase().replaceAll("[^A-Z0-9-]", ""));
        product.setStock(stock);
        product.setLowStockThreshold(5);
        product.setReservedStock(0);
        product.setVisible(true);
        product.setOccasionTag(occasionTag);
        product.setRating(BigDecimal.valueOf(rating));
        product.setScentNotes(scentNotes);
        product.setBurnTime(burnTime);
        product.setCategory(category);
        product.setImageUrls(imageUrls);
        return product;
    }

    private CandleFix candleFix(String title, String cause, String steps) {
        CandleFix fix = new CandleFix();
        fix.setTitle(title);
        fix.setCause(cause);
        fix.setFixSteps(steps.strip());
        fix.setVideoUrl("https://example.com/tutorial");
        fix.setBeforeImage("https://images.unsplash.com/photo-1602874801006-e26c327f2f17?auto=format&fit=crop&w=900&q=80");
        fix.setAfterImage("https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80");
        return fix;
    }

    private StylingGuide stylingGuide(
        String title,
        String slug,
        String description,
        String imageUrl,
        String detailedContent
    ) {
        StylingGuide guide = new StylingGuide();
        guide.setTitle(title);
        guide.setSlug(slug);
        guide.setDescription(description);
        guide.setImageUrl(imageUrl);
        guide.setDetailedContent(detailedContent.strip());
        return guide;
    }

    private Faq faq(String question, String answer, int orderIndex) {
        Faq faq = new Faq();
        faq.setQuestion(question);
        faq.setAnswer(answer);
        faq.setOrderIndex(orderIndex);
        return faq;
    }

    private AppUser user(String name, String email, Role role) {
        AppUser user = new AppUser();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("Password123!"));
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setEmailVerified(true);
        user.setPhoneVerified(false);
        return user;
    }

}
