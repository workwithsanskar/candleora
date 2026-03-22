import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/designer/image.png";
import bookshelfImage from "../assets/designer/bookshelf-floral.png";
import candleFixesCard from "../assets/designer/candle-fixes-card.png";
import stylingGuideCard from "../assets/designer/styling-guides-card.png";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { catalogApi, contentApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

const recommendationCards = [
  {
    title: "Occasion Picks",
    image: bookshelfImage,
    description: "Not sure which candle suits your celebration?",
    to: "/occasion-picks",
  },
  {
    title: "Styling Guides",
    image: stylingGuideCard,
    description: "Wondering how to style your candles?",
    to: "/styling-guides",
  },
  {
    title: "Candle Fixes",
    image: candleFixesCard,
    description: "Quick solutions to fix every candle problem.",
    to: "/candle-fixes",
  },
];

const customerStories = [
  {
    name: "Riya Sharma",
    date: "18 Jan 2026",
    quote:
      "The candles look premium, burn evenly, and the packaging felt gift-ready the moment it arrived.",
  },
  {
    name: "Aarav Mehta",
    date: "12 Jan 2026",
    quote:
      "Exactly the kind of warm, elegant decor piece I wanted for my bedroom corner and work desk.",
  },
  {
    name: "Sana Khan",
    date: "06 Jan 2026",
    quote:
      "I ordered for a housewarming and the whole set looked much more expensive than the price suggested.",
  },
];

const categoryLabels = {
  flower: "Flower",
  holder: "Holder",
  glass: "Glass",
  "candle-sets": "Candle Sets",
  "tea-light": "Tea Light",
  textured: "Textured Candles",
};

function StarRow({ compact = false }) {
  const sizeClassName = compact ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className="flex items-center gap-0.5 text-[#f1b643]">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className={`${sizeClassName} fill-current`}
          aria-hidden="true"
        >
          <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
        </svg>
      ))}
    </div>
  );
}

function ArrowButton({ direction, label }) {
  const rotation = direction === "left" ? "rotate-180" : "";

  return (
    <button
      type="button"
      className="hidden h-10 w-10 items-center justify-center text-brand-dark/30 transition hover:text-brand-dark lg:inline-flex"
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${rotation}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M8 5L16 12L8 19" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M2.5 12C4.4 8.7 7.8 6.5 12 6.5C16.2 6.5 19.6 8.7 21.5 12C19.6 15.3 16.2 17.5 12 17.5C7.8 17.5 4.4 15.3 2.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function HomeProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  wishlisted,
  isInCart,
}) {
  const item = normalizeProduct(product);

  return (
    <article className="space-y-2">
      <Link to={`/product/${item.id}`} className="block">
        <div className="relative overflow-hidden rounded-[8px] bg-[#d7d7d7]">
          <img
            src={item.imageUrls[0]}
            alt={item.name}
            className="aspect-[0.82] w-full object-cover"
          />
          {item.discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-[#ff3a3a] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
              {item.discount}% off
            </span>
          )}
          <button
            type="button"
            className={`absolute right-2 top-2 rounded-full p-1.5 drop-shadow-[0_3px_10px_rgba(0,0,0,0.25)] transition ${
              wishlisted ? "bg-[#2f241d] text-white" : "text-white"
            }`}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            onClick={(event) => {
              event.preventDefault();
              onToggleWishlist(item);
            }}
          >
            <HeartIcon filled={wishlisted} />
          </button>
        </div>
      </Link>

      <div className="space-y-1 text-center">
        <Link to={`/product/${item.id}`}>
          <h3 className="truncate text-[12px] text-brand-dark">{item.name}</h3>
        </Link>
        <div className="flex items-center justify-center gap-1.5 text-[11px]">
          {item.originalPrice > item.price && (
            <span className="text-brand-dark/40 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
          <span className="font-semibold text-brand-dark">{formatCurrency(item.price)}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <StarRow compact />
          <span className="text-[10px] text-brand-dark/55">({item.rating.toFixed(1)})</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart(item, 1)}
        disabled={item.stock <= 0}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-[4px] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition ${
          item.stock <= 0
            ? "cursor-not-allowed bg-[#d4d4d4]"
            : isInCart
              ? "bg-[#0b8f12] hover:bg-[#08770e]"
              : "bg-[#f2b84b] hover:bg-[#dfaa46]"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5H5L7.2 15.2C7.4 16.1 8.2 16.8 9.1 16.8H17.4C18.3 16.8 19.1 16.2 19.3 15.3L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.2" />
          <circle cx="18" cy="20" r="1.2" />
        </svg>
        {item.stock <= 0 ? "Out of Stock" : isInCart ? "Added" : "Add to Cart"}
      </button>
    </article>
  );
}

function CategoryTile({ category, className = "" }) {
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className={`relative block overflow-hidden rounded-[10px] bg-[#cfcfcf] ${className}`.trim()}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 text-[13px] font-medium text-white">
        {category.name}
      </span>
    </Link>
  );
}

function TestimonialCard({ story }) {
  return (
    <article className="rounded-[12px] border border-[#f0d5a0] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(209,171,92,0.12)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 rounded-full bg-black" />
        <p className="text-[11px] font-semibold text-brand-dark">{story.name}</p>
        <span className="text-[10px] text-brand-dark/45">{story.date}</span>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-brand-dark/65">{story.quote}</p>
      <div className="mt-2">
        <StarRow compact />
      </div>
    </article>
  );
}

function Home() {
  const { addToCart, items: cartItems } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [error, setError] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        const [categoryResponse, productResponse, faqResponse] = await Promise.all([
          catalogApi.getCategories(),
          catalogApi.getProducts({ size: 4, sort: "popular" }),
          contentApi.getFaqs(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryResponse);
        setFeaturedProducts(productResponse.content ?? []);
        setFaqs(faqResponse.slice(0, 4));
      } catch (homeError) {
        if (isMounted) {
          setError(formatApiError(homeError));
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.slug, category);
    });
    return map;
  }, [categories]);

  const getCategory = (slug) =>
    categoryMap.get(slug) ?? {
      id: slug,
      slug,
      name: categoryLabels[slug] ?? slug,
    };

  const cartProductIds = useMemo(
    () => new Set(cartItems.map((item) => Number(item.productId ?? item.id))),
    [cartItems],
  );

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="The storefront could not load"
          message={error}
          action={
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Browse the shop
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <div className="bg-white pb-20">
      <section className="container-shell pt-5 sm:pt-6">
        <div className="relative overflow-hidden rounded-[18px] border border-[#e6dacd] bg-[#1b110b] shadow-[0_24px_60px_rgba(27,17,11,0.16)] sm:rounded-[24px] lg:rounded-[28px]">
          <img
            src={heroImage}
            alt="CandleOra hero arrangement"
            className="h-[330px] w-full object-cover sm:h-[430px] lg:h-[520px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.36)] via-[rgba(0,0,0,0.1)] to-transparent" />
          <div className="absolute left-[6%] top-[14%] max-w-[290px] sm:max-w-[360px] lg:max-w-[430px]">
            <h1 className="text-[1.9rem] font-semibold leading-[1.22] text-white sm:text-[2.35rem] lg:text-[3rem]">
              <span className="block">Crafting Comfort, Redefining</span>
              <span className="block">Spaces. Your Home, Your Signature</span>
              <span className="block">Style!</span>
            </h1>
            <Link
              to="/shop"
              className="mt-4 inline-flex rounded-[4px] bg-white px-4 py-2 text-[13px] font-semibold text-brand-dark shadow-[0_6px_16px_rgba(0,0,0,0.16)] transition hover:bg-brand-primary hover:text-white"
            >
              Shop Now
            </Link>
          </div>
          <div className="pointer-events-none absolute -bottom-14 left-1/2 h-24 w-[128%] -translate-x-1/2 rounded-[100%] bg-white sm:-bottom-16 sm:h-28 lg:-bottom-20 lg:h-32" />
        </div>
      </section>

      <section className="container-shell py-14 sm:py-16">
        <h2 className="text-center text-[1.95rem] font-semibold tracking-[-0.02em] text-brand-dark">
          Our Best Selling Products
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-[40px_1fr_40px] lg:items-center">
          <ArrowButton direction="left" label="Previous products" />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => (
              <HomeProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                wishlisted={isWishlisted(product.id)}
                isInCart={cartProductIds.has(Number(product.id))}
              />
            ))}
          </div>

          <ArrowButton direction="right" label="Next products" />
        </div>
      </section>

      <section className="container-shell py-8">
        <h2 className="text-center text-[1.95rem] font-semibold tracking-[-0.02em] text-brand-dark">
          View Our Range Of Categories
        </h2>

        <div className="mt-10">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr_1fr]">
            <CategoryTile category={getCategory("flower")} className="min-h-[250px] lg:min-h-[360px]" />
            <div className="grid gap-4">
              <CategoryTile category={getCategory("holder")} className="min-h-[118px] lg:min-h-[172px]" />
              <CategoryTile category={getCategory("glass")} className="min-h-[118px] lg:min-h-[172px]" />
            </div>
            <CategoryTile category={getCategory("candle-sets")} className="min-h-[250px] lg:min-h-[360px]" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_1.45fr]">
            <CategoryTile category={getCategory("tea-light")} className="min-h-[118px]" />
            <CategoryTile category={getCategory("textured")} className="min-h-[118px]" />
          </div>
        </div>
      </section>

      <section className="mt-8 bg-[#f2b84b] py-4">
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-brand-dark">
          Free Delivery When You Spend Over Rs.1999/-
        </p>
      </section>

      <section id="recommendations" className="container-shell py-16">
        <h2 className="text-[1.95rem] font-semibold tracking-[-0.02em] text-brand-dark">
          The Recommendations
        </h2>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {recommendationCards.map((card) => (
            <article key={card.title} className="mx-auto w-full max-w-[290px] text-center">
              <Link
                to={card.to}
                className="relative block overflow-hidden rounded-[10px] shadow-[0_12px_24px_rgba(51,51,51,0.08)]"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="aspect-[0.94] w-full object-cover"
                />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[rgba(232,195,158,0.38)] px-4 py-3 backdrop-blur-[1px]">
                  <h3 className="text-[1.1rem] font-semibold uppercase tracking-[0.04em] text-black">
                    {card.title}
                  </h3>
                </div>
              </Link>
              <p className="mt-3 text-[13px] leading-5 text-brand-dark/75">{card.description}</p>
              <Link
                to={card.to}
                className="mt-4 inline-flex min-w-[168px] items-center justify-center gap-2 rounded-[4px] bg-black px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
              >
                <EyeIcon />
                View
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <h2 className="text-[1.95rem] font-semibold tracking-[-0.02em] text-brand-dark">
          Our Happy Customers
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {customerStories.map((story) => (
            <TestimonialCard key={story.name} story={story} />
          ))}
        </div>
      </section>

      <section id="faq" className="container-shell grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <h2 className="text-[1.95rem] font-semibold tracking-[-0.02em] text-brand-dark">
            Frequently Asked Questions
          </h2>
          <p className="max-w-sm text-[13px] leading-7 text-brand-dark/65">
            Learn more about shipping, candle care, and burn-time details before placing your first
            CandleOra order.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              type="button"
              onClick={() => setExpandedFaq((current) => (current === faq.id ? null : faq.id))}
              className="w-full border-b border-[#e9e0d6] pb-4 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-[14px] font-medium text-brand-dark">{faq.question}</span>
                <span className="pt-0.5 text-brand-dark/45">{expandedFaq === faq.id ? "-" : "+"}</span>
              </div>
              {expandedFaq === faq.id && (
                <p className="mt-3 max-w-2xl text-[13px] leading-7 text-brand-dark/65">
                  {faq.answer}
                </p>
              )}
            </button>
          ))}

          <div className="flex justify-end pt-2">
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-dark transition hover:text-brand-primary"
            >
              View More
              <span className="text-base leading-none">+</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
