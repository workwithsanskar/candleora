import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { FILTERABLE_CATEGORIES } from "../constants/categories";
import { catalogApi } from "../services/api";
import { formatApiError } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

const initialVisibleCount = 8;
const loadMoreStep = 4;

const occasionBuckets = ["Birthday", "Wedding", "Relaxation", "Housewarming"];

const priceRanges = [
  { id: "80-400", label: "Rs. 80 - Rs. 400", min: 80, max: 400 },
  { id: "400-950", label: "Rs. 400 - Rs. 950", min: 400, max: 950 },
  { id: "950-1500", label: "Rs. 950 - Rs. 1500", min: 950, max: 1500 },
  { id: "1500-2500", label: "Rs. 1500 - Rs. 2500", min: 1500, max: 2500 },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="rounded-[18px] border border-black/10 bg-white px-5 py-5 shadow-candle">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-[2px] bg-black" />
        <h2 className="text-[1.1rem] font-medium text-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OccasionPicks() {
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
        const occasionResponses = await Promise.all(
          occasionBuckets.map((occasion) =>
            catalogApi.getProducts({ size: 24, occasion, sort: "popular" }),
          ),
        );

        if (!isMounted) {
          return;
        }

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

      const matchesCategory = !selectedCategory || item.category.slug === selectedCategory;

      const matchesPrice =
        !activeRange || (item.price >= activeRange.min && item.price <= activeRange.max);

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [activeRange, curatedProducts, deferredSearch, selectedCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const showingFrom = filteredProducts.length > 0 ? 1 : 0;
  const showingTo = visibleProducts.length;
  const hasMoreProducts = visibleCount < filteredProducts.length;

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <FilterSection title="Categories">
            <div className="space-y-3">
              {FILTERABLE_CATEGORIES.map((item) => (
                <button
                  key={item.slug || "all"}
                  type="button"
                  onClick={() => setSelectedCategory(item.slug)}
                  className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm transition ${
                    selectedCategory === item.slug
                      ? "bg-brand-primary text-black"
                      : "text-black/82 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-xs">{selectedCategory === item.slug ? "•" : ""}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="space-y-3">
              {priceRanges.map((range) => (
                <label key={range.id} className="flex items-center gap-3 text-sm text-black/82">
                  <input
                    type="checkbox"
                    checked={selectedPriceRange === range.id}
                    onChange={() =>
                      setSelectedPriceRange((currentRange) =>
                        currentRange === range.id ? "" : range.id,
                      )
                    }
                    className="h-4 w-4 accent-black"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        </aside>

        <div className="space-y-6">
          <div className="space-y-5">
            <h1 className="font-display text-heading-lg font-semibold text-black">
              Occasion Picks
            </h1>

            <label className="flex items-center gap-3 rounded-full border border-black/15 px-5 py-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search An Item"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                <SearchIcon />
              </span>
            </label>

            <p className="text-sm text-black/76">
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
                <Link to="/" className="btn btn-primary mt-6">
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
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="pt-8 text-center">
                <p className="text-sm text-black/76">
                  Showing {showingFrom}-{showingTo} of {filteredProducts.length} item(s)
                </p>
                <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-black/12" />
                {hasMoreProducts && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((currentVisibleCount) => currentVisibleCount + loadMoreStep)}
                    className="btn btn-primary mt-6"
                  >
                    Load More
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
