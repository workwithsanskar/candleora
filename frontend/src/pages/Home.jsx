import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import candleFixesCard from "../assets/designer/candle-fixes-recommendation.webp";
import heroImage from "../assets/designer/image-optimized.webp";
import occasionPicksCard from "../assets/designer/occasion-picks-recommendation.webp";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import ProductSlider from "../components/ProductSlider";
import Recommendations from "../components/Recommendations";
import Reveal from "../components/Reveal";
import StatusView from "../components/StatusView";
import { getCategoryBySlug } from "../constants/categories";
import { catalogApi, contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

const fallbackTestimonials = [
  {
    id: "fallback-riya-sharma",
    customerName: "Riya Sharma",
    displayDate: "18 Jan 2026",
    quote:
      "The candles look premium, burn evenly, and the packaging felt gift-ready the moment it arrived.",
    rating: 5,
  },
  {
    id: "fallback-aarav-mehta",
    customerName: "Aarav Mehta",
    displayDate: "12 Jan 2026",
    quote:
      "Exactly the kind of warm, elegant decor piece I wanted for my bedroom corner and work desk.",
    rating: 5,
  },
  {
    id: "fallback-sana-khan",
    customerName: "Sana Khan",
    displayDate: "06 Jan 2026",
    quote:
      "I ordered for a housewarming and the whole set looked much more expensive than the price suggested.",
    rating: 5,
  },
];

const recommendationCards = [
  {
    title: "Occasion Picks",
    description: "Not sure which candle suits your celebration?",
    image: occasionPicksCard,
    to: "/occasion-picks",
  },
  {
    title: "Candle Fixes",
    description: "Quick solutions to fix every candle problem.",
    image: candleFixesCard,
    to: "/candle-fixes",
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
        <p className="text-base font-semibold text-black">{story.customerName}</p>
        <span className="text-sm text-black/45">{story.displayDate}</span>
      </div>
      <p className="mt-3 text-base leading-6 text-black/72">{story.quote}</p>
      <div className="mt-3 flex items-center gap-0.5 text-[#f3b33d]">
        {Array.from({ length: 5 }).map((_, index) => {
          const isFilled = index < Math.min(5, Math.max(1, Number(story.rating ?? 5)));

          return (
            <svg
              key={index}
              viewBox="0 0 24 24"
              className={`h-[18px] w-[18px] ${isFilled ? "fill-current" : "fill-transparent stroke-current opacity-35"}`}
              strokeWidth={isFilled ? undefined : "1.8"}
            >
              <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
            </svg>
          );
        })}
      </div>
    </article>
  );
}

function Home() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const testimonialCarouselRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
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
  const testimonialsQuery = useQuery({
    queryKey: ["content", "testimonials"],
    queryFn: () => contentApi.getTestimonials(),
  });

  const featuredProducts = featuredProductsQuery.data ?? [];
  const faqs = faqsQuery.data ?? [];
  const testimonials = Array.isArray(testimonialsQuery.data)
    ? testimonialsQuery.data
    : fallbackTestimonials;
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
              <h1
                className="text-[1.95rem] font-bold leading-[1.12] tracking-normal text-white sm:text-[2.45rem] sm:leading-[1.1] lg:w-[666px] lg:text-[40px] lg:leading-[1.14]"
                style={{ fontFamily: '"Oxygen", "Segoe UI", sans-serif' }}
              >
                Crafting Comfort, Redefining Spaces. Your Home, Your Signature Style!
              </h1>
              <Link
                to="/shop"
                className="mt-5 inline-flex h-[46px] min-w-[142px] items-center justify-center rounded-[6px] bg-[#f3b33d] px-5 text-[16px] font-semibold tracking-[0.01em] text-[#1A1A1A] transition hover:bg-[#e8a92f] lg:mt-6"
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

      <section className="container-shell py-8 sm:py-10">
        <Reveal delay={0.08}>
          <div className="mb-8 text-center">
            <h2 className="section-title">The Recommendations</h2>
          </div>
          <Recommendations cards={recommendationCards} />
        </Reveal>
      </section>

      {testimonials.length > 0 ? (
        <section className="container-shell pt-12 pb-8 sm:pt-14 sm:pb-10">
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
              {testimonials.map((story) => (
                <TestimonialCard key={story.id ?? `${story.customerName}-${story.displayDate}`} story={story} />
              ))}
            </div>
          </Reveal>
        </section>
      ) : null}

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
                        <m.span
                          animate={prefersReducedMotion ? undefined : { rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                          className="pt-0.5 text-black/45"
                        >
                          +
                        </m.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <m.div
                            key="faq-answer"
                            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <m.p
                              initial={prefersReducedMotion ? false : { y: -4, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={prefersReducedMotion ? { opacity: 0 } : { y: -4, opacity: 0 }}
                              transition={{ duration: 0.2, delay: prefersReducedMotion ? 0 : 0.04 }}
                              className="mt-3 text-sm leading-7 text-black/68"
                            >
                              {faq.answer}
                            </m.p>
                          </m.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <Link
                    to="/faq"
                    className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-black transition"
                  >
                    <span className="transition group-hover:underline group-hover:underline-offset-4">
                      View More
                    </span>
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
