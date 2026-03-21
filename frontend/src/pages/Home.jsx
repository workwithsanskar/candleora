import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { catalogApi, contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [fixes, setFixes] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [error, setError] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        const [categoryResponse, productResponse, fixesResponse, faqResponse] =
          await Promise.all([
            catalogApi.getCategories(),
            catalogApi.getProducts({ size: 4, sort: "popular" }),
            contentApi.getFixes(),
            contentApi.getFaqs(),
          ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryResponse.slice(0, 6));
        setFeaturedProducts(productResponse.content ?? []);
        setFixes(fixesResponse.slice(0, 3));
        setFaqs(faqResponse.slice(0, 3));
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
    <div className="space-y-20 pb-20 pt-10">
      <section className="container-shell">
        <div className="grid items-center gap-10 overflow-hidden rounded-[36px] bg-brand-dark px-6 py-8 text-white shadow-candle md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-12">
          <div className="space-y-6">
            <p className="eyebrow text-brand-accent">Handmade candle ritual</p>
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-tight sm:text-6xl">
              Crafting comfort, redefining everyday spaces.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Discover warm gifting edits, calming fragrances, and practical candle care guides designed for beautiful homes and thoughtful celebrations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent hover:text-brand-dark"
              >
                Shop Collection
              </Link>
              <Link
                to="/styling-guides"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-brand-accent hover:text-brand-accent"
              >
                Explore Styling Guides
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-5 h-24 w-24 rounded-full bg-brand-accent/30 blur-3xl" />
            <img
              src={heroImage}
              alt="CandleOra curated candle set"
              className="relative w-full rounded-[28px] border border-white/10 object-cover shadow-candle"
            />
          </div>
        </div>
      </section>

      <section className="container-shell space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by mood</p>
            <h2 className="section-title mt-3">Signature categories</h2>
          </div>
          <Link className="text-sm font-semibold text-brand-primary" to="/shop">
            View all products
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.slug}`}
              className="panel group flex min-h-[160px] items-end overflow-hidden p-6"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-brand-muted">
                  0{index + 1}
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-brand-dark">
                  {category.name}
                </h3>
                <p className="mt-3 text-sm text-brand-dark/70">
                  Curated candles for styling, gifting, and slow evenings.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shell space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Best sellers</p>
            <h2 className="section-title mt-3">Most-loved pours</h2>
          </div>
          <Link className="text-sm font-semibold text-brand-primary" to="/occasion-picks">
            Shop occasions
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-shell grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Candle fixes</p>
          <h2 className="section-title mt-3">Quick care for common issues</h2>
          <div className="mt-8 space-y-4">
            {fixes.map((fix) => (
              <article key={fix.id} className="rounded-[24px] bg-brand-secondary p-5">
                <h3 className="font-display text-2xl font-semibold text-brand-dark">
                  {fix.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-brand-dark/70">{fix.cause}</p>
              </article>
            ))}
          </div>
          <Link
            to="/candle-fixes"
            className="mt-6 inline-flex rounded-full border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
          >
            Read all candle fixes
          </Link>
        </div>

        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title mt-3">Helpful answers before checkout</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <button
                key={faq.id}
                type="button"
                onClick={() =>
                  setExpandedFaq((current) => (current === faq.id ? null : faq.id))
                }
                className="w-full rounded-[24px] border border-brand-primary/10 bg-white p-5 text-left transition hover:border-brand-primary/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-brand-dark">{faq.question}</span>
                  <span className="text-brand-primary">
                    {expandedFaq === faq.id ? "-" : "+"}
                  </span>
                </div>
                {expandedFaq === faq.id && (
                  <p className="mt-4 text-sm leading-7 text-brand-dark/70">{faq.answer}</p>
                )}
              </button>
            ))}
          </div>
          <Link
            to="/faq"
            className="mt-6 inline-flex rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            Explore full FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
