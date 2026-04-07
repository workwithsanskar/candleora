import PropTypes from "prop-types";
import { m, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.jpg";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { getProductPath } from "../utils/normalize";

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

HeartIcon.propTypes = {
  filled: PropTypes.bool,
};

HeartIcon.defaultProps = {
  filled: false,
};

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3.5 5H6L8.2 14.2H17.6L20 7.5H7.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="18.5" r="1.4" />
      <circle cx="17" cy="18.5" r="1.4" />
    </svg>
  );
}

function Wishlist() {
  const prefersReducedMotion = useReducedMotion();
  const { addToCart } = useCart();
  const { items, removeFromWishlist } = useWishlist();

  if (!items.length) {
    return (
      <section className="container-shell py-12 sm:py-14">
        <StatusView
          title="Wishlist"
          message="Save your favorites and add them to cart anytime."
          action={(
            <Link to="/shop" className="btn btn-primary mt-6">
              Explore the shop
            </Link>
          )}
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-12 sm:py-14">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="space-y-3">
            <h1 className="page-title">Wishlist</h1>
            <p className="max-w-[760px] text-body leading-7 text-black/62">
              Save your favorites and add them to cart anytime.
            </p>
          </div>
        </div>

        <div
          className={`${items.length > 4 ? "stealth-scrollbar max-h-[80vh] overflow-y-auto pr-2" : ""}`.trim()}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((item, index) => {
              const savings = Math.max(Number(item.originalPrice ?? 0) - Number(item.price ?? 0), 0);

              return (
                <m.article
                  key={item.id}
                  className="h-full overflow-hidden rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_18px_34px_rgba(0,0,0,0.05)] sm:p-5"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: prefersReducedMotion ? 0 : index * 0.04 }}
                >
                  <div className="grid gap-5 md:grid-cols-[190px_minmax(0,1fr)]">
                    <div className="relative overflow-hidden rounded-[22px] bg-[#f5f1e8]">
                      <Link to={getProductPath(item)} className="block h-full">
                        <img
                          {...getResponsiveImageProps(item.imageUrl, {
                            widths: [192, 288, 384],
                            quality: 68,
                            sizes: "190px",
                          })}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => applyImageFallback(event, fallbackProductImage)}
                          className="aspect-[0.92] h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                        />
                      </Link>
                      <button
                        type="button"
                        aria-label="Remove from wishlist"
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[#d63d3d] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-white"
                      >
                        <HeartIcon filled />
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-brand-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black">
                            {item.category?.name ?? "Candles"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              item.stock > 0
                                ? "bg-[#eef7ee] text-[#2d7d32]"
                                : "bg-[#fff1f1] text-[#c62828]"
                            }`}
                          >
                            {item.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <Link to={getProductPath(item)} className="block">
                            <h2 className="text-[1.2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-black transition hover:underline hover:underline-offset-4 sm:text-[1.35rem]">
                              {item.name}
                            </h2>
                          </Link>
                          <p className="max-w-[540px] text-sm leading-6 text-black/62">
                            {item.occasionTag
                              ? `Saved under ${item.occasionTag}. A strong pick for your next decor refresh or gifting plan.`
                              : "A refined CandleOra favorite saved for your next decor refresh."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                          <span className="text-[1.55rem] font-semibold leading-none text-black">
                            {formatCurrency(item.price)}
                          </span>
                          {Number(item.originalPrice) > Number(item.price) ? (
                            <span className="text-lg text-black/35 line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                          ) : null}
                          {savings > 0 ? (
                            <span className="pb-1 text-sm font-semibold text-brand-primary">
                              Save {formatCurrency(savings)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          disabled={item.stock <= 0}
                          className="inline-flex h-[50px] min-w-[190px] items-center justify-center gap-2 rounded-[14px] bg-black px-6 text-base font-semibold text-white transition hover:bg-black/88 disabled:cursor-not-allowed disabled:bg-black/15 disabled:text-black/45"
                        >
                          <CartIcon />
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </div>
                </m.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Wishlist;
