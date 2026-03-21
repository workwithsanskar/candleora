package com.candleora.config;

import com.candleora.entity.AppUser;
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
                "A calming lavender and cedar candle poured in a soft frosted glass vessel for evening wind-down rituals.",
                799,
                12,
                18,
                "Relaxation",
                4.9,
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
                10,
                12,
                "Wedding",
                4.8,
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
                8,
                25,
                "Housewarming",
                4.7,
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
                15,
                9,
                "Birthday",
                4.9,
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
                6,
                30,
                "Birthday",
                4.6,
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
                9,
                14,
                "Wedding",
                4.7,
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
                11,
                20,
                "Relaxation",
                4.8,
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
                13,
                11,
                "Wedding",
                4.9,
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
                    "Tunneling Wax",
                    "The candle was extinguished before a full melt pool formed across the surface.",
                    "1. Allow the candle to burn long enough for the top layer to melt edge to edge.\n2. If tunneling has started, wrap the top with foil and leave an opening above the wick.\n3. Burn again for 1 to 2 hours and trim the wick before the next use."
                ),
                candleFix(
                    "Smoking Wick",
                    "The wick has become too long or has collected carbon buildup while burning.",
                    "1. Extinguish the flame safely.\n2. Trim the wick to about 1/4 inch.\n3. Remove loose soot before relighting and keep the candle away from strong drafts."
                ),
                candleFix(
                    "Uneven Burn",
                    "Air movement or an off-center wick is causing one side to melt faster than the other.",
                    "1. Place the candle on a flat, draft-free surface.\n2. Rotate the candle between burns if needed.\n3. Encourage a full melt pool on the next burn to reset the surface."
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
                faq("How long should I burn my candle the first time?", "Burn it until the top wax layer melts edge to edge to prevent tunneling.", 1),
                faq("Do you offer gift-ready options?", "Yes. Occasion picks and select product sets are designed for gifting and ready presentation.", 2),
                faq("Can I use CandleOra products for events?", "Yes. Wedding and celebration-friendly candles are included in the occasion filters.", 3),
                faq("How do I care for the wick?", "Trim it to about 1/4 inch before each burn for a cleaner, steadier flame.", 4)
            ));
        }
    }

    private void seedUsers() {
        if (appUserRepository.count() > 0) {
            return;
        }

        appUserRepository.save(user("Demo Customer", "demo@candleora.com", Role.USER));
        appUserRepository.save(user("CandleOra Admin", "admin@candleora.com", Role.ADMIN));
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
        int discount,
        int stock,
        String occasionTag,
        double rating,
        Category category,
        List<String> imageUrls
    ) {
        Product product = new Product();
        product.setName(name);
        product.setSlug(slug);
        product.setDescription(description);
        product.setPrice(BigDecimal.valueOf(price));
        product.setDiscount(discount);
        product.setStock(stock);
        product.setOccasionTag(occasionTag);
        product.setRating(BigDecimal.valueOf(rating));
        product.setCategory(category);
        product.setImageUrls(imageUrls);
        return product;
    }

    private CandleFix candleFix(String title, String cause, String steps) {
        CandleFix fix = new CandleFix();
        fix.setTitle(title);
        fix.setCause(cause);
        fix.setFixSteps(steps);
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
        return user;
    }
}
