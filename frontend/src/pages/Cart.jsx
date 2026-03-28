import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import fallbackImage from "../assets/designer/image-optimized.jpg";
import ProductSlider from "../components/ProductSlider";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { catalogApi } from "../services/api";
import { formatCurrency } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { getProductPath } from "../utils/normalize";

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6L18 18" strokeLinecap="round" />
      <path d="M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function Cart() {
  const { isAuthenticated } = useAuth();
  const { items, grandTotal, updateQuantity, removeFromCart, isLoading, error } = useCart();
  const [recommendations, setRecommendations] = useState([]);

  const visibleRecommendations = useMemo(() => {
    const cartProductIds = new Set(
      items.map((item) => Number(item.productId ?? item.id)),
    );

    return recommendations.filter(
      (product) => !cartProductIds.has(Number(product.id ?? product.productId)),
    );
  }, [items, recommendations]);

  useEffect(() => {
    let isMounted = true;

    catalogApi
      .getProducts({ size: 8, sort: "popular" })
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
          <div className="space-y-3">
            <p className="eyebrow">Cart</p>
            <h1 className="page-title">Your candle selection</h1>
            {!isLoading && !error && items.length ? (
              <p className="max-w-[760px] text-sm leading-7 text-black/60">
                Review your picks, update quantities, and remove anything you do not need before moving to checkout.
              </p>
            ) : null}
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
            <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-candle">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 bg-[#fffdfa] px-5 py-4 lg:px-6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-black">
                    {items.length} {items.length === 1 ? "item" : "items"} in your cart
                  </p>
                  <p className="text-sm leading-6 text-black/58">
                    Need something else too? You can continue shopping and come right back here.
                  </p>
                </div>
                <Link
                  to="/shop"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-black/12 px-5 text-sm font-semibold text-black transition hover:border-black/24 hover:bg-black/4"
                >
                  Continue shopping
                </Link>
              </div>

              <div className="hidden grid-cols-[minmax(0,1.9fr)_110px_150px_120px] items-center gap-6 bg-black/82 px-6 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white lg:grid">
                <p>Product</p>
                <p>Price</p>
                <p>Quantity</p>
                <p>Total</p>
              </div>

              <div>
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className={`grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.9fr)_110px_150px_120px] lg:items-center lg:gap-6 lg:px-6 ${
                      index !== items.length - 1 ? "border-b border-black/8" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 transition hover:bg-black/5 hover:text-danger"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        <RemoveIcon />
                      </button>

                      <Link to={getProductPath({ id: item.productId, name: item.productName })} className="shrink-0">
                        <img
                          {...getResponsiveImageProps(item.imageUrl, {
                            widths: [136, 204, 272],
                            quality: 64,
                            sizes: "68px",
                          })}
                          alt={item.productName}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => applyImageFallback(event, fallbackImage)}
                          className="h-[88px] w-[68px] rounded-[10px] bg-black/5 object-cover"
                        />
                      </Link>

                      <div className="min-w-0 space-y-2">
                        <Link
                          to={getProductPath({ id: item.productId, name: item.productName })}
                          className="block text-[15px] font-semibold leading-6 text-black transition hover:text-brand-primary"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/42">
                          Handpicked for your cart
                        </p>
                        <p className="text-xs text-black/48 lg:hidden">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs font-semibold uppercase tracking-[0.12em] text-danger transition hover:opacity-80 lg:hidden"
                        >
                          Remove
                        </button>
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
                      <div className="inline-flex items-center rounded-full border border-black/10 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.04)]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-4 py-2 text-lg text-black/65 transition hover:text-black"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-4 py-2 text-lg text-black/65 transition hover:text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                        Total
                      </p>
                      <p className="text-sm font-semibold text-black">{formatCurrency(item.lineTotal)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

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

          <div className="rounded-[20px] border border-brand-primary/12 bg-[#fff9ee] px-4 py-4 text-sm leading-6 text-brand-dark/68">
            Free shipping is already included. Any coupon savings will appear once applied at checkout.
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

      {!isLoading && !error && items.length && visibleRecommendations.length ? (
        <div className="space-y-5 pt-10 sm:pt-12">
          <h2 className="section-title">You May Also Like</h2>
          <div className="px-2 lg:px-10 xl:px-14">
            <ProductSlider
              products={visibleRecommendations}
              maxDesktopCards={4}
              arrowTopClass="top-[180px]"
              arrowLeftClass="-left-12 xl:-left-16"
              arrowRightClass="-right-12 xl:-right-16"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Cart;
