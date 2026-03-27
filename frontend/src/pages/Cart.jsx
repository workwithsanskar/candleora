import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LazyProductCard from "../components/LazyProductCard";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { catalogApi } from "../services/api";
import { formatCurrency } from "../utils/format";

function Cart() {
  const { isAuthenticated } = useAuth();
  const { items, grandTotal, updateQuantity, removeFromCart, isLoading, error } = useCart();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    catalogApi
      .getProducts({ size: 4, sort: "popular" })
      .then((response) => {
        if (isMounted) {
          setRecommendations(response.content ?? []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecommendations([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <div>
            <p className="eyebrow">Cart</p>
            <h1 className="page-title mt-3">Your candle selection</h1>
          </div>

          {isLoading ? (
            <StatusView
              title="Refreshing cart"
              message="Pulling the latest item quantities and totals."
            />
          ) : error ? (
            <StatusView title="Cart unavailable" message={error} />
          ) : items.length === 0 ? (
            <StatusView
              title="Your cart is empty"
              message="Browse the CandleOra collection and add a few favorites."
              action={
                <Link to="/shop" className="btn btn-primary mt-6">
                  Start shopping
                </Link>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-black/12 bg-white shadow-candle">
              <div className="hidden grid-cols-[minmax(0,1.8fr)_110px_130px_110px] items-center gap-6 bg-black/82 px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white lg:grid">
                <p>Product</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
              </div>

              <div>
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className={`grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.8fr)_110px_130px_110px] lg:items-center lg:gap-6 lg:px-6 ${
                      index !== items.length - 1 ? "border-b border-black/8" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="mt-2 text-sm text-black/40 transition hover:text-danger"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        ×
                      </button>
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-[72px] w-[52px] rounded-[6px] bg-black/5 object-cover"
                      />
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium leading-5 text-black">
                          {item.productName}
                        </h2>
                        <p className="mt-2 text-xs text-black/48 lg:hidden">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                        Price
                      </p>
                      <p className="text-sm text-black/68">{formatCurrency(item.unitPrice)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                        Quantity
                      </p>
                      <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-4 py-2 text-lg text-black/65"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-4 py-2 text-lg text-black/65"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                        Total
                      </p>
                      <p className="text-sm font-medium text-black">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && items.length && recommendations.length ? (
            <div className="space-y-5 pt-4">
              <h2 className="section-title">You May Also Like</h2>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {recommendations.map((product, index) => (
                  <LazyProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="panel h-fit space-y-6 p-6">
          <div>
            <p className="eyebrow">Cart details</p>
            <h2 className="panel-title mt-3">Order snapshot</h2>
          </div>

          <div className="space-y-3 rounded-[24px] bg-white p-5">
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Subtotal</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Discount</span>
              <span>--</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between border-t border-brand-primary/10 pt-3">
              <span className="text-sm font-semibold text-brand-dark">Total</span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <Link to="/checkout" className="btn btn-success w-full text-center">
              Proceed to checkout
            </Link>
          ) : (
            <Link
              to="/login"
              state={{ from: { pathname: "/checkout" } }}
              className="btn btn-primary w-full text-center"
            >
              Sign in to checkout
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}

export default Cart;
