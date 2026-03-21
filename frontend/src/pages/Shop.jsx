import { useDeferredValue, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { catalogApi } from "../services/api";
import { formatApiError } from "../utils/format";

const sortOptions = [
  { label: "Popularity", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

function Shop() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [occasion, setOccasion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("popular");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    catalogApi
      .getCategories()
      .then(setCategories)
      .catch((categoryError) => setError(formatApiError(categoryError)));
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");

    catalogApi
      .getProducts({
        page,
        size: 8,
        search: deferredSearch || undefined,
        category: category || undefined,
        occasion: occasion || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort,
      })
      .then((response) => {
        if (!isMounted) {
          return;
        }
        setProducts(response.content ?? []);
        setTotalPages(Math.max(response.totalPages ?? 1, 1));
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
  }, [page, deferredSearch, category, occasion, minPrice, maxPrice, sort]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, category, occasion, minPrice, maxPrice, sort]);

  return (
    <section className="container-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit space-y-8 p-6">
          <div>
            <p className="eyebrow">Filters</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
              Candle shop
            </h1>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-dark">Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Lavender, gifting, relaxation..."
              className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none transition focus:border-brand-primary"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-dark">Category</p>
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                category === ""
                  ? "bg-brand-primary text-white"
                  : "bg-brand-secondary text-brand-dark"
              }`}
            >
              All categories
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.slug)}
                className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  category === item.slug
                    ? "bg-brand-primary text-white"
                    : "bg-brand-secondary text-brand-dark"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-brand-dark">Occasion</p>
            <select
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
              className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
            >
              <option value="">All occasions</option>
              <option value="Birthday">Birthday</option>
              <option value="Wedding">Wedding</option>
              <option value="Relaxation">Relaxation</option>
              <option value="Housewarming">Housewarming</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">Min price</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="200"
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">Max price</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="1200"
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
              />
            </label>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Collection</p>
              <p className="mt-3 text-sm text-brand-dark/70">
                Filter the catalog by category, price, search, and occasion.
              </p>
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <StatusView
              title="Loading the candle shelf"
              message="We are pulling the latest catalog from the CandleOra API."
            />
          ) : error ? (
            <StatusView
              title="Products could not be loaded"
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
          ) : products.length === 0 ? (
            <StatusView
              title="No products match those filters"
              message="Try widening the price range or clearing the category and occasion filters."
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
                  className="rounded-full border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-dark disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-brand-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() =>
                    setPage((currentPage) => Math.min(currentPage + 1, totalPages - 1))
                  }
                  className="rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Shop;
