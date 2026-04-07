import { useDeferredValue, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import LazyProductCard from "../components/LazyProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import StatusView from "../components/StatusView";
import { FILTERABLE_CATEGORIES } from "../constants/categories";
import { catalogApi } from "../services/api";
import { formatApiError } from "../utils/format";

const pageSize = 8;

const priceRanges = [
  { id: "80-400", label: "Rs. 80 - Rs. 400", min: 80, max: 400 },
  { id: "400-950", label: "Rs. 400 - Rs. 950", min: 400, max: 950 },
  { id: "950-1500", label: "Rs. 950 - Rs. 1500", min: 950, max: 1500 },
  { id: "1500-2500", label: "Rs. 1500 - Rs. 2500", min: 1500, max: 2500 },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="rounded-[22px] border border-black/10 bg-white px-4 py-3.5 shadow-[0_10px_22px_rgba(0,0,0,0.045)]">
      <div className="mb-2.5 flex items-center gap-3">
        <span className="h-4.5 w-[2px] bg-black" />
        <h2 className="text-[0.98rem] font-semibold text-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get("price") ?? "");
  const prefersReducedMotion = useReducedMotion();
  const deferredSearch = useDeferredValue(search);

  const activeRange = priceRanges.find((range) => range.id === selectedPriceRange) ?? null;
  const searchParamsSnapshot = searchParams.toString();

  useEffect(() => {
    const nextParams = new URLSearchParams();
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      nextParams.set("search", trimmedSearch);
    }

    if (category) {
      nextParams.set("category", category);
    }

    if (selectedPriceRange) {
      nextParams.set("price", selectedPriceRange);
    }

    const nextSnapshot = nextParams.toString();
    if (nextSnapshot !== searchParamsSnapshot) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [category, search, searchParamsSnapshot, selectedPriceRange, setSearchParams]);

  const trimmedSearch = deferredSearch.trim();
  const productsQuery = useInfiniteQuery({
    queryKey: ["catalog", "shop", trimmedSearch, category, activeRange?.id ?? ""],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      catalogApi.getProducts({
        page: pageParam,
        size: pageSize,
        search: trimmedSearch || undefined,
        category: category || undefined,
        minPrice: activeRange?.min,
        maxPrice: activeRange?.max,
        sort: "popular",
      }),
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage?.page ?? 0);
      const totalPages = Math.max(Number(lastPage?.totalPages ?? 0), 1);

      return currentPage + 1 < totalPages ? currentPage + 1 : undefined;
    },
  });

  const products = productsQuery.data?.pages.flatMap((response) => response?.content ?? []) ?? [];
  const firstPage = productsQuery.data?.pages?.[0];
  const totalElements = Number(firstPage?.totalElements ?? products.length);
  const error = productsQuery.error ? formatApiError(productsQuery.error) : "";

  const visibleCount = products.length;
  const showingFrom = visibleCount > 0 ? 1 : 0;
  const showingTo = visibleCount;
  const hasMorePages = Boolean(productsQuery.hasNextPage);
  const initialSkeletonCount = 6;
  const isInitialLoading = productsQuery.isPending;
  const isLoadingMore = productsQuery.isFetchingNextPage;
  const filterMotionDisabled = Boolean(prefersReducedMotion);
  const gridAnimationKey = `${category}|${selectedPriceRange}|${trimmedSearch}`;

  return (
    <section className="container-shell py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[236px_1fr]">
        <aside className="space-y-2.5">
          <FilterSection title="Categories">
            <div className="space-y-0.5">
              {FILTERABLE_CATEGORIES.map((item) => (
                <button
                  key={item.slug || "all"}
                  type="button"
                  onClick={() => setCategory(item.slug)}
                  className={`flex w-full items-center justify-between rounded-full px-4 py-2 text-left text-[0.96rem] leading-[1.05] transition ${
                    category === item.slug
                      ? "bg-brand-primary font-semibold text-black"
                      : "text-black/82 hover:bg-black/[0.03] hover:text-black"
                  }`}
                >
                  <span className="whitespace-nowrap">{item.name}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="space-y-2.5">
              {priceRanges.map((range) => (
                <label key={range.id} className="flex items-center gap-3 text-[0.96rem] leading-[1.05] text-black/82">
                  <input
                    type="radio"
                    name="shop-price-range"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id)}
                    className="h-4 w-4 shrink-0 accent-black"
                  />
                  <span className="whitespace-nowrap">{range.label}</span>
                </label>
              ))}
              {selectedPriceRange ? (
                <button
                  type="button"
                  onClick={() => setSelectedPriceRange("")}
                  className="mt-1 text-left text-sm font-medium text-black/55 transition hover:text-black"
                >
                  Clear price filter
                </button>
              ) : null}
            </div>
          </FilterSection>
        </aside>

        <div className="space-y-5">
          <div className="space-y-4">
            <h1 className="font-display text-heading-lg font-semibold text-black">Shop</h1>

            <label className="flex items-center gap-3 rounded-full border border-black/15 px-5 py-2.5">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
              />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
                <SearchIcon />
              </span>
            </label>

            <p className="text-sm text-black/76">
              Showing {showingFrom}-{showingTo} of {totalElements} products
            </p>
          </div>

          {isInitialLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: initialSkeletonCount }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <StatusView
              title="Products could not be loaded"
              message={error}
              action={
                <Link to="/" className="btn btn-primary mt-6">
                  Return home
                </Link>
              }
            />
          ) : products.length === 0 ? (
            <StatusView
              title="No products match those filters"
              message="Try widening the price range or clearing the category filter."
            />
          ) : (
            <>
              <m.div
                layout={!filterMotionDisabled}
                transition={
                  filterMotionDisabled
                    ? undefined
                    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                }
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {products.map((product, index) => (
                    <m.div
                      key={`${gridAnimationKey}-${product.id}`}
                      layout={!filterMotionDisabled}
                      initial={
                        filterMotionDisabled ? false : { opacity: 0, y: 18, scale: 0.985 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        filterMotionDisabled ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.985 }
                      }
                      transition={{
                        duration: filterMotionDisabled ? 0 : 0.26,
                        delay: filterMotionDisabled ? 0 : Math.min(index, 5) * 0.035,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <LazyProductCard
                        product={product}
                        priority={index < initialSkeletonCount}
                      />
                    </m.div>
                  ))}
                </AnimatePresence>

                {isLoadingMore &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <m.div
                      key={`loading-${index}`}
                      initial={filterMotionDisabled ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={filterMotionDisabled ? { opacity: 0 } : { opacity: 0, y: -10 }}
                      transition={{ duration: filterMotionDisabled ? 0 : 0.22 }}
                    >
                      <ProductCardSkeleton />
                    </m.div>
                  ))}
              </m.div>

              {hasMorePages && (
                <div className="pt-8 text-center">
                  <p className="text-sm text-black/76">
                    Showing {showingFrom}-{showingTo} of {totalElements} products
                  </p>
                  <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-black/12" />
                  <button
                    type="button"
                    onClick={() => productsQuery.fetchNextPage()}
                    disabled={isLoadingMore}
                    className="btn btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Shop;
