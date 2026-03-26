import { useDeferredValue, useEffect, useState } from "react";
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

function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  const activeRange = priceRanges.find((range) => range.id === selectedPriceRange) ?? null;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");

    catalogApi
      .getProducts({
        page,
        size: pageSize,
        search: deferredSearch || undefined,
        category: category || undefined,
        minPrice: activeRange?.min,
        maxPrice: activeRange?.max,
        sort: "popular",
      })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const nextProducts = response.content ?? [];
        setProducts((currentProducts) =>
          page === 0 ? nextProducts : [...currentProducts, ...nextProducts],
        );
        setTotalPages(Math.max(response.totalPages ?? 1, 1));
        setTotalElements(Number(response.totalElements ?? nextProducts.length));
      })
      .catch((productsError) => {
        if (isMounted) {
          setError(formatApiError(productsError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, deferredSearch, category, activeRange]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, category, selectedPriceRange]);

  const visibleCount = products.length;
  const showingFrom = visibleCount > 0 ? 1 : 0;
  const showingTo = visibleCount;
  const hasMorePages = page + 1 < totalPages;
  const initialSkeletonCount = 6;

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
                  onClick={() => setCategory(item.slug)}
                  className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm transition ${
                    category === item.slug
                      ? "bg-brand-primary text-black"
                      : "text-black/82 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-xs">{category === item.slug ? "\u2022" : ""}</span>
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
            <h1 className="font-display text-heading-lg font-semibold text-black">Shop</h1>

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
              Showing {showingFrom}-{showingTo} of {totalElements} item(s)
            </p>
          </div>

          {isLoading && page === 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <LazyProductCard
                    key={product.id}
                    product={product}
                    priority={page === 0 && index < initialSkeletonCount}
                  />
                ))}
                {isLoading &&
                  page > 0 &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <ProductCardSkeleton key={`loading-${index}`} />
                  ))}
              </div>

              {hasMorePages && (
                <div className="pt-8 text-center">
                  <p className="text-sm text-black/76">
                    Showing {showingFrom}-{showingTo} of {totalElements} item(s)
                  </p>
                  <div className="mx-auto mt-4 h-px w-full max-w-[420px] bg-black/12" />
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={isLoading}
                    className="btn btn-primary mt-6 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isLoading ? "Loading..." : "Load More"}
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
