import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/designer/image-optimized.jpg";
import bookshelfImage from "../assets/designer/bookshelf-floral.png";
import candleFixesCard from "../assets/designer/candle-fixes-card.png";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductSlider from "../components/ProductSlider";
import Reveal from "../components/Reveal";
import StatusView from "../components/StatusView";
import { getCategoryBySlug } from "../constants/categories";
import { catalogApi, contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

const recommendationCards = [
  {
    title: "Occasion Picks",
    image: bookshelfImage,
    description: "Not sure which candle suits your celebration?",
    to: "/occasion-picks",
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

function CategoryTile({ category, className = "" }) {
  return (
    <Link
      to={category.to}
      className={`group relative block overflow-hidden rounded-[14px] bg-[#cfcfcf] ${className}`.trim()}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition group-hover:from-black/45" />
      <span className="absolute bottom-4 left-4 text-base font-medium text-white">
        {category.name}
      </span>
    </Link>
  );
}

function TestimonialCard({ story }) {
  return (
    <article className="rounded-[14px] border border-[#f0d5a0] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(209,171,92,0.12)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 rounded-full bg-black" />
        <p className="text-base font-semibold text-black">{story.name}</p>
        <span className="text-sm text-black/45">{story.date}</span>
      </div>
      <p className="mt-3 text-base leading-7 text-black/72">{story.quote}</p>
      <div className="mt-3 flex items-center gap-0.5 text-[#f3b33d]">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg key={index} viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
            <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
          </svg>
        ))}
      </div>
    </article>
  );
}

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [error, setError] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        const [productResponse, faqResponse] = await Promise.all([
          catalogApi.getProducts({ size: 8, sort: "popular" }),
          contentApi.getFaqs(),
        ]);

        if (!isMounted) {
          return;
        }

        setFeaturedProducts(productResponse.content ?? []);
        setFaqs((faqResponse ?? []).slice(0, 4));
        setExpandedFaq(faqResponse?.[0]?.id ?? null);
      } catch (homeError) {
        if (isMounted) {
          setError(formatApiError(homeError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="The storefront could not load"
          message={error}
          action={
            <Link to="/shop" className="btn btn-primary mt-6">
              Browse the shop
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <div className="bg-white pb-20">
      <section className="relative w-full overflow-hidden bg-black">
        <img
          src={heroImage}
          alt="CandleOra hero arrangement"
          loading="eager"
          fetchPriority="high"
          className="h-[320px] w-full object-cover sm:h-[410px] lg:h-[520px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
        <div className="container-shell absolute inset-0 flex items-center">
          <div className="max-w-[560px]">
            <h1 className="font-display text-[2rem] font-semibold leading-[0.98] text-white sm:text-[2.75rem] lg:text-[4rem]">
              <span className="block">Crafting Comfort, Redefining</span>
              <span className="block">Spaces. Your Home, Your</span>
              <span className="block">Signature</span>
              <span className="block">Style!</span>
            </h1>
            <Link
              to="/shop"
              className="btn btn-primary mt-8 min-w-[160px]"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-12">
        <Reveal>
          <h2 className="section-title text-center">Our Best Selling Products</h2>

          <div className="mt-10 px-2 lg:px-10 xl:px-14">
            {isLoading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <ProductSlider
                products={featuredProducts}
                arrowTopClass="top-[180px]"
                arrowLeftClass="-left-12 xl:-left-16"
                arrowRightClass="-right-12 xl:-right-16"
              />
            )}
          </div>
        </Reveal>
      </section>

      <section className="container-shell py-14 sm:py-16">
        <Reveal delay={0.05}>
          <h2 className="section-title text-center">View Our Range Of Categories</h2>

          <div className="mt-10">
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.8fr_1.05fr]">
              <CategoryTile category={getCategoryBySlug("")} className="min-h-[250px] lg:min-h-[360px]" />
              <div className="grid gap-4">
                <CategoryTile category={getCategoryBySlug("candle-sets")} className="min-h-[118px] lg:min-h-[172px]" />
                <CategoryTile category={getCategoryBySlug("glass")} className="min-h-[118px] lg:min-h-[172px]" />
              </div>
              <CategoryTile category={getCategoryBySlug("tea-light")} className="min-h-[250px] lg:min-h-[360px]" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <CategoryTile category={getCategoryBySlug("flower")} className="min-h-[118px]" />
              <CategoryTile category={getCategoryBySlug("creation")} className="min-h-[118px]" />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-brand-primary py-4">
        <p className="text-center text-base font-semibold text-black sm:text-[1.1rem]">
          Free Delivery &amp; Free Gift when you spend over Rs. 1999/-
        </p>
      </section>

      <section id="recommendations" className="container-shell py-16 sm:py-20">
        <Reveal delay={0.08}>
          <h2 className="section-title">Recommendations</h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {recommendationCards.map((card) => (
              <article
                key={card.title}
                className="mx-auto flex h-full w-full max-w-[380px] flex-col items-center text-center"
              >
                <Link
                  to={card.to}
                  className="relative block w-full overflow-hidden rounded-[16px] shadow-[0_12px_24px_rgba(51,51,51,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(51,51,51,0.14)]"
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[rgba(243,179,61,0.26)] px-4 py-3 backdrop-blur-[1.5px]">
                    <h3 className="text-[1.15rem] font-semibold uppercase tracking-[0.03em] text-black sm:text-[1.25rem]">
                      {card.title}
                    </h3>
                  </div>
                </Link>

                <div className="mt-4 flex min-h-[68px] w-full items-start justify-center px-2">
                  <p className="max-w-[312px] text-base leading-7 text-black/72">{card.description}</p>
                </div>

                <Link
                  to={card.to}
                  className="btn btn-secondary mt-auto flex h-[50px] w-full items-center justify-center gap-2 tracking-[0.08em] uppercase hover:-translate-y-0.5"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2.5 12C4.6 8.1 8 6.2 12 6.2C16 6.2 19.4 8.1 21.5 12C19.4 15.9 16 17.8 12 17.8C8 17.8 4.6 15.9 2.5 12Z" />
                    <circle cx="12" cy="12" r="2.8" />
                  </svg>
                  View
                </Link>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="container-shell py-8 sm:py-10">
        <Reveal delay={0.1}>
          <h2 className="section-title">Our Happy Customers</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {customerStories.map((story) => (
              <TestimonialCard key={story.name} story={story} />
            ))}
          </div>
        </Reveal>
      </section>

      <section id="faq" className="container-shell grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="contents" delay={0.12}>
          <div className="space-y-4">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="max-w-sm text-sm leading-7 text-black/62">
              Learn more about shipping, candle care, and burn-time details before placing your first CandleOra order.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = expandedFaq === faq.id;

              return (
                <article key={faq.id} className="rounded-[14px] border border-black/12 bg-white px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq((current) => (current === faq.id ? null : faq.id))}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <span className="text-base font-medium text-black">{faq.question}</span>
                    <span className="pt-0.5 text-black/45">{isOpen ? "-" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm leading-7 text-black/68">{faq.answer}</p>
                  )}
                </article>
              );
            })}

            <div className="flex justify-end pt-2">
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-black transition hover:text-brand-primary"
              >
                View More
                <span className="text-base leading-none">+</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default Home;
