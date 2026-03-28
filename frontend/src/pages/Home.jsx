import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
      <span className="absolute bottom-3 left-3 text-[15px] font-medium text-white">
        {category.name}
      </span>
    </Link>
  );
}

function TestimonialCard({ story }) {
  return (
    <article
      data-testimonial-card
      className="w-[320px] shrink-0 snap-start rounded-[14px] border border-[#f0d5a0] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(209,171,92,0.12)] sm:w-[360px] lg:w-[390px] xl:w-[calc((100%-40px)/3)]"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-4 w-4 rounded-full bg-black" />
        <p className="text-base font-semibold text-black">{story.name}</p>
        <span className="text-sm text-black/45">{story.date}</span>
      </div>
      <p className="mt-3 text-base leading-6 text-black/72">{story.quote}</p>
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
  const [expandedFaq, setExpandedFaq] = useState(null);
  const testimonialCarouselRef = useRef(null);
  const featuredProductsQuery = useQuery({
    queryKey: ["catalog", "products", { size: 8, sort: "popular" }],
    queryFn: () => catalogApi.getProducts({ size: 8, sort: "popular" }),
    select: (response) => response?.content ?? [],
  });
  const faqsQuery = useQuery({
    queryKey: ["content", "faqs"],
    queryFn: () => contentApi.getFaqs(),
    select: (response) => (response ?? []).slice(0, 4),
  });

  const featuredProducts = featuredProductsQuery.data ?? [];
  const faqs = faqsQuery.data ?? [];
  const productError = featuredProductsQuery.error
    ? formatApiError(featuredProductsQuery.error)
    : "";
  const faqError = faqsQuery.error ? formatApiError(faqsQuery.error) : "";
  const isProductsLoading = featuredProductsQuery.isPending;
  const isFaqsLoading = faqsQuery.isPending;

  const scrollTestimonials = (direction) => {
    const container = testimonialCarouselRef.current;
    if (!container) {
      return;
    }

    const card = container.querySelector("[data-testimonial-card]");
    const cardWidth = card ? card.getBoundingClientRect().width + 20 : 380;

    container.scrollBy({
      left: direction * cardWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    setExpandedFaq((currentExpandedFaq) => {
      if (!faqs.length) {
        return null;
      }

      return faqs.some((faq) => faq.id === currentExpandedFaq)
        ? currentExpandedFaq
        : (faqs[0]?.id ?? null);
    });
  }, [faqs]);

  return (
    <div className="bg-white pb-8">
      <section className="relative w-full overflow-hidden bg-black">
        <img
          src={heroImage}
          alt="CandleOra hero arrangement"
          loading="eager"
          fetchPriority="high"
          className="h-[340px] w-full object-cover object-center sm:h-[430px] lg:h-[585px] xl:h-[620px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/18 via-black/4 to-transparent" />
        <div className="absolute inset-0">
          <div className="w-full px-6 sm:px-10 lg:px-[128px] xl:px-[136px]">
            <div className="max-w-[680px] pt-[56px] text-left sm:pt-[74px] lg:w-[666px] lg:max-w-none lg:pt-[132px] xl:pt-[146px]">
              <h1 className="font-sans text-[1.95rem] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[2.45rem] lg:text-[40px]">
                <span className="block lg:whitespace-nowrap">Crafting Comfort, Redefining</span>
                <span className="block lg:whitespace-nowrap">Spaces. Your Home, Your</span>
                <span className="block lg:whitespace-nowrap">Signature Style!</span>
              </h1>
              <Link
                to="/shop"
                className="mt-3 inline-flex h-[45px] min-w-[143px] items-center justify-center rounded-[5px] bg-brand-primary px-5 text-[0.95rem] font-medium text-black shadow-[0_6px_16px_rgba(243,179,61,0.28)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.03] lg:mt-3.5"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-12">
        <Reveal>
          <h2 className="section-title text-center">Our Best Selling Products</h2>

          <div className="mt-10 px-2 lg:px-10 xl:px-14">
            {isProductsLoading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : productError ? (
              <StatusView
                title="Best sellers unavailable"
                message={productError}
                action={
                  <Link to="/shop" className="btn btn-primary mt-6">
                    Browse the shop
                  </Link>
                }
              />
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

      <section className="container-shell pb-10 pt-6 sm:pb-12 sm:pt-8">
        <Reveal delay={0.05}>
          <h2 className="section-title text-center">View Our Range Of Categories</h2>

          <div className="mt-8">
            <div className="grid gap-3 lg:grid-cols-[1.05fr_0.8fr_1.05fr]">
              <CategoryTile category={getCategoryBySlug("")} className="min-h-[220px] lg:min-h-[320px]" />
              <div className="grid gap-4">
                <CategoryTile category={getCategoryBySlug("candle-sets")} className="min-h-[102px] lg:min-h-[152px]" />
                <CategoryTile category={getCategoryBySlug("glass")} className="min-h-[102px] lg:min-h-[152px]" />
              </div>
              <CategoryTile category={getCategoryBySlug("tea-light")} className="min-h-[220px] lg:min-h-[320px]" />
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
              <CategoryTile category={getCategoryBySlug("flower")} className="min-h-[102px]" />
              <CategoryTile category={getCategoryBySlug("creation")} className="min-h-[102px]" />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-brand-primary py-4">
        <p className="text-center text-base font-semibold text-black sm:text-[1.1rem]">
          Free Delivery &amp; Free Gift when you spend over Rs. 1999/-
        </p>
      </section>

      <section id="recommendations" className="container-shell py-12 sm:py-14">
        <Reveal delay={0.08}>
          <h2 className="section-title">Recommendations</h2>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {recommendationCards.map((card) => (
              <article
                key={card.title}
                className="mx-auto flex h-full w-full max-w-[340px] flex-col items-center text-center"
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
                    className="aspect-[0.92] w-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[rgba(243,179,61,0.26)] px-4 py-2.5 backdrop-blur-[1.5px]">
                    <h3 className="text-[1.08rem] font-semibold uppercase tracking-[0.03em] text-black sm:text-[1.18rem]">
                      {card.title}
                    </h3>
                  </div>
                </Link>

                <div className="mt-3 flex min-h-[56px] w-full items-start justify-center px-2">
                  <p className="max-w-[292px] text-[15px] leading-6 text-black/72">{card.description}</p>
                </div>

                <Link
                  to={card.to}
                  className="btn btn-secondary mt-auto flex h-[46px] w-full items-center justify-center gap-2 tracking-[0.08em] uppercase hover:-translate-y-0.5"
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

      <section className="container-shell pt-4 pb-8 sm:pt-6 sm:pb-10">
        <Reveal delay={0.1}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="section-title">Our Happy Customers</h2>

            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollTestimonials(-1)}
                aria-label="Scroll testimonials left"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/12 bg-white text-black/70 transition hover:border-black/22 hover:bg-black/[0.03] hover:text-black"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14.5 6.5L9 12L14.5 17.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollTestimonials(1)}
                aria-label="Scroll testimonials right"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/12 bg-white text-black/70 transition hover:border-black/22 hover:bg-black/[0.03] hover:text-black"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9.5 6.5L15 12L9.5 17.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div
            ref={testimonialCarouselRef}
            className="stealth-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pr-1 scroll-smooth"
          >
            {customerStories.map((story) => (
              <TestimonialCard key={`${story.name}-${story.date}`} story={story} />
            ))}
          </div>
        </Reveal>
      </section>

      <section id="faq" className="container-shell grid gap-10 pt-14 pb-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="contents" delay={0.12}>
          <div className="space-y-4">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="max-w-sm text-sm leading-7 text-black/62">
              Learn more about shipping, candle care, and burn-time details before placing your first CandleOra order.
            </p>
          </div>

          <div className="space-y-3">
            {isFaqsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <article
                  key={`faq-loading-${index}`}
                  className="rounded-[14px] border border-black/12 bg-white px-5 py-4"
                >
                  <div className="h-5 w-3/4 animate-pulse rounded bg-black/8" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-black/6" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-black/6" />
                </article>
              ))
            ) : faqError ? (
              <StatusView title="FAQ unavailable" message={faqError} />
            ) : (
              <>
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
              </>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default Home;
