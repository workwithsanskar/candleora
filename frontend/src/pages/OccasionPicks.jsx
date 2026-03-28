import { useDeferredValue, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import LazyProductCard from "../components/LazyProductCard";
import StatusView from "../components/StatusView";
import { FILTERABLE_CATEGORIES } from "../constants/categories";
import { catalogApi } from "../services/api";
import { formatApiError } from "../utils/format";

const pageSize = 8;

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
    <section className="rounded-[22px] border border-black/10 bg-white px-5 py-5 shadow-[0_12px_26px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-6 w-[2px] bg-black" />
        <h2 className="text-base font-semibold text-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OccasionPicks() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const deferredSearch = useDeferredValue(search);

  const activeRange = priceRanges.find((range) => range.id === selectedPriceRange) ?? null;
  const trimmedSearch = deferredSearch.trim();
  const productsQuery = useInfiniteQuery({
    queryKey: ["catalog", "occasion-picks", trimmedSearch, selectedCategory, activeRange?.id ?? ""],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      catalogApi.getProducts({
        page: pageParam,
        size: pageSize,
        occasions: occasionBuckets.join(","),
        search: trimmedSearch || undefined,
        category: selectedCategory || undefined,
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

  const visibleProducts = productsQuery.data?.pages.flatMap((response) => response?.content ?? []) ?? [];
  const firstPage = productsQuery.data?.pages?.[0];
  const totalElements = Number(firstPage?.totalElements ?? visibleProducts.length);
  const showingFrom = totalElements > 0 ? 1 : 0;
  const showingTo = visibleProducts.length;
  const hasMoreProducts = Boolean(productsQuery.hasNextPage);
  const error = productsQuery.error ? formatApiError(productsQuery.error) : "";
  const isInitialLoading = productsQuery.isPending;
  const isLoadingMore = productsQuery.isFetchingNextPage;

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <FilterSection title="Categories">
            <div className="space-y-1.5">
              {FILTERABLE_CATEGORIES.map((item) => (
                <button
                  key={item.slug || "all"}
                  type="button"
                  onClick={() => setSelectedCategory(item.slug)}
                  className={`flex w-full items-center justify-between rounded-full px-4 py-3 text-left text-[0.98rem] leading-none transition ${
                    selectedCategory === item.slug
                      ? "bg-brand-primary text-black"
                      : "text-black/82 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-sm">{selectedCategory === item.slug ? "\u2022" : ""}</span>
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <div className="space-y-2.5">
              {priceRanges.map((range) => (
                <label key={range.id} className="flex items-center gap-3 text-[0.95rem] leading-none text-black/82">
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

            <p className="text-sm text-black/76">Showing {showingFrom}-{showingTo} of {totalElements} item(s)</p>
          </div>

          {isInitialLoading ? (
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
          ) : visibleProducts.length === 0 ? (
            <StatusView
              title="No occasion picks match those filters"
              message="Try clearing the category filter or widening the price range."
            />
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product, index) => (
                  <LazyProductCard key={product.id} product={product} priority={index < 6} />
                ))}
              </div>

              <div className="pt-8 text-center">
                <p className="text-sm text-black/76">Showing {showingFrom}-{showingTo} of {totalElements} item(s)</p>
                <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-black/12" />
                {hasMoreProducts && (
                  <button
                    type="button"
                    onClick={() => productsQuery.fetchNextPage()}
                    disabled={isLoadingMore}
                    className="btn btn-primary mt-6"
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
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

