import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { catalogApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

const initialVisibleCount = 9;
const loadMoreStep = 3;

const occasionBuckets = ["Birthday", "Wedding", "Relaxation", "Housewarming"];

const priceRanges = [
  { id: "80-400", label: "Rs. 80 - Rs. 400", min: 80, max: 400 },
  { id: "400-950", label: "Rs. 400 - Rs. 950", min: 400, max: 950 },
  { id: "950-1500", label: "Rs. 950 - Rs. 1500", min: 950, max: 1500 },
  { id: "1500-2500", label: "Rs. 1500 - Rs. 2500", min: 1500, max: 2500 },
];

const preferredCategoryOrder = [
  { slug: "candle-sets", label: "Sets" },
  { slug: "glass", label: "Glass" },
  { slug: "holder", label: "Holders" },
  { slug: "tea-light", label: "Tea Lights" },
  { slug: "textured", label: "Textured" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarRow() {
  return (
    <div className="flex items-center justify-center gap-0.5 text-[#f4a71b]">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
        </svg>
      ))}
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="border border-[#dddddd] bg-white px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-[2px] bg-black" />
        <h2 className="text-[1.1rem] font-medium text-brand-dark">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OccasionProductCard({ product, isInCart, onAddToCart }) {
  const item = normalizeProduct(product);

  return (
    <article className="space-y-3">
      <Link to={`/product/${item.id}`} className="block">
        <div className="relative overflow-hidden rounded-[10px] bg-[#bcbcbc]">
          <div className="aspect-[0.78] w-full" />
          {item.discount > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-[#414141] px-2 py-1 text-[9px] font-semibold uppercase leading-none text-white">
              -{item.discount}%
            </span>
          )}
        </div>
      </Link>

      <div className="space-y-1 text-center">
        <Link to={`/product/${item.id}`}>
          <h3 className="truncate text-[15px] text-brand-dark">{item.name}</h3>
        </Link>

        <div className="flex items-center justify-center gap-1.5 text-[13px]">
          {item.originalPrice > item.price && (
            <span className="text-brand-dark/35 line-through">{formatCurrency(item.originalPrice)}</span>
          )}
          <span className="font-semibold text-brand-dark">{formatCurrency(item.price)}</span>
        </div>

        <div className="flex items-center justify-center gap-1">
          <StarRow />
          <span className="text-[11px] text-brand-dark/55">({Math.max(1, Math.round(item.rating))})</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart(item)}
        disabled={item.stock <= 0}
        className={`inline-flex w-full items-center justify-center rounded-[4px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition ${
          item.stock <= 0
            ? "cursor-not-allowed bg-[#bcbcbc]"
            : isInCart
              ? "bg-[#0b8f12] hover:bg-[#08770e]"
              : "bg-[#f2b84b] hover:bg-[#ddaa44]"
        }`}
      >
        {item.stock <= 0 ? "Out of Stock" : isInCart ? "Added" : "Add to Cart"}
      </button>
    </article>
  );
}

function OccasionPicks() {
  const { items: cartItems, addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [curatedProducts, setCuratedProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  const activeRange = priceRanges.find((range) => range.id === selectedPriceRange) ?? null;

  useEffect(() => {
    let isMounted = true;

    const loadOccasionProducts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [categoryResponse, ...occasionResponses] = await Promise.all([
          catalogApi.getCategories(),
          ...occasionBuckets.map((occasion) =>
            catalogApi.getProducts({ size: 24, occasion, sort: "popular" }),
          ),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryResponse);

        const dedupedProducts = [];
        const seenIds = new Set();

        occasionResponses
          .flatMap((response) => response.content ?? [])
          .forEach((product) => {
            const productId = Number(product.id);

            if (seenIds.has(productId)) {
              return;
            }

            seenIds.add(productId);
            dedupedProducts.push(product);
          });

        setCuratedProducts(dedupedProducts);
      } catch (occasionError) {
        if (isMounted) {
          setError(formatApiError(occasionError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOccasionProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(initialVisibleCount);
  }, [deferredSearch, selectedCategory, selectedPriceRange]);

  const orderedCategories = useMemo(() => {
    const bySlug = new Map(categories.map((item) => [item.slug, item]));

    return preferredCategoryOrder.map((item) => ({
      slug: item.slug,
      name: bySlug.get(item.slug)?.name ?? item.label,
    }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return curatedProducts.filter((product) => {
      const item = normalizeProduct(product);
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.occasionTag.toLowerCase().includes(normalizedSearch) ||
        item.category.name.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory || item.category.slug === selectedCategory;

      const matchesPrice =
        !activeRange || (item.price >= activeRange.min && item.price <= activeRange.max);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [activeRange, curatedProducts, deferredSearch, selectedCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const showingFrom = filteredProducts.length > 0 ? 1 : 0;
  const showingTo = visibleProducts.length;
  const hasMoreProducts = visibleCount < filteredProducts.length;
  const cartProductIds = new Set(cartItems.map((item) => Number(item.productId ?? item.id)));

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[160px_1fr] xl:grid-cols-[180px_1fr]">
        <aside className="space-y-4">
          <FilterSection title="Categories">
            <div className="space-y-3 text-[14px] text-brand-dark/82">
              <span className="block font-medium text-[#e0a337]">Occasion Picks</span>
              <Link to="/styling-guides" className="block transition hover:text-brand-dark">
                Styling Guides
              </Link>

              {orderedCategories.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() =>
                    setSelectedCategory((currentCategory) =>
                      currentCategory === item.slug ? "" : item.slug,
                    )
                  }
                  className={`flex w-full items-center justify-between text-left transition ${
                    selectedCategory === item.slug
                      ? "font-semibold text-brand-dark"
                      : "text-brand-dark/82 hover:text-brand-dark"
                  }`}
                >
                  <span>{item.name}</span>
                  <ChevronIcon />
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="space-y-3">
              {priceRanges.map((range) => (
                <label
                  key={range.id}
                  className="flex items-center gap-3 text-[13px] text-brand-dark/82"
                >
                  <input
                    type="checkbox"
                    checked={selectedPriceRange === range.id}
                    onChange={() =>
                      setSelectedPriceRange((currentRange) =>
                        currentRange === range.id ? "" : range.id,
                      )
                    }
                    className="h-3.5 w-3.5 accent-brand-dark"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        </aside>

        <div className="space-y-6">
          <div className="space-y-5">
            <h1 className="text-[2.7rem] font-semibold tracking-[-0.04em] text-brand-dark">
              OCCASION PICKS
            </h1>

            <label className="flex items-center gap-3 rounded-full border border-[#d9d9d9] px-5 py-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search An Item"
                className="w-full bg-transparent text-[14px] text-brand-dark outline-none placeholder:text-brand-dark/35"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#5f5a55] text-white">
                <SearchIcon />
              </span>
            </label>

            <p className="text-[13px] text-brand-dark/76">
              Showing {showingFrom}-{showingTo} of {filteredProducts.length} item(s)
            </p>
          </div>

          {isLoading ? (
            <StatusView
              title="Loading occasion picks"
              message="We are curating the current CandleOra occasion edit."
            />
          ) : error ? (
            <StatusView
              title="Occasion picks unavailable"
              message={error}
              action={
                <Link
                  to="/"
                  className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Return home
                </Link>
              }
            />
          ) : filteredProducts.length === 0 ? (
            <StatusView
              title="No occasion picks match those filters"
              message="Try clearing the category filter or widening the price range."
            />
          ) : (
            <>
              <div className="grid gap-x-4 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <OccasionProductCard
                    key={`${product.id}`}
                    product={product}
                    isInCart={cartProductIds.has(Number(product.id))}
                    onAddToCart={(item) => addToCart(item, 1)}
                  />
                ))}
              </div>

              <div className="pt-8 text-center">
                <p className="text-[13px] text-brand-dark/76">
                  Showing {showingFrom}-{showingTo} of {filteredProducts.length} item(s)
                </p>
                <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-[#d5d5d5]" />
                {hasMoreProducts && (
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((currentVisibleCount) => currentVisibleCount + loadMoreStep)
                    }
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-7 py-3 text-[15px] font-medium text-white transition hover:bg-black"
                  >
                    Load More
                    <span className="text-lg leading-none">{">"}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default OccasionPicks;
