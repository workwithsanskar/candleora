import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { catalogApi } from "../services/api";
import { formatApiError } from "../utils/format";

const occasions = ["Birthday", "Wedding", "Relaxation", "Housewarming"];

function OccasionPicks() {
  const [occasion, setOccasion] = useState("Birthday");
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    catalogApi
      .getProducts({ size: 8, occasion, sort: "popular" })
      .then((response) => {
        if (isMounted) {
          setProducts(response.content ?? []);
        }
      })
      .catch((occasionError) => {
        if (isMounted) {
          setError(formatApiError(occasionError));
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
  }, [occasion]);

  return (
    <section className="container-shell space-y-8 py-10">
      <div className="panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Occasion picks</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
            Curated gifting edits for every mood.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-dark/70">
            Use the occasion filter to surface ready-to-gift candles and table accents for celebrations, self-care, and intimate spaces.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {occasions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setOccasion(option)}
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                occasion === option
                  ? "bg-brand-primary text-white"
                  : "bg-brand-secondary text-brand-dark"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <StatusView
          title="Loading occasion picks"
          message="Refreshing curated products for the selected occasion."
        />
      ) : error ? (
        <StatusView title="Occasion picks unavailable" message={error} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default OccasionPicks;
