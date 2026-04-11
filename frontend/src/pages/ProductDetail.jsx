import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.webp";
import ProductDetailSkeleton from "../components/ProductDetailSkeleton";
import ProductSlider from "../components/ProductSlider";
import Reveal from "../components/Reveal";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import { useWishlist } from "../context/WishlistContext";
import { catalogApi } from "../services/api";
import { formatApiError, formatCurrency, formatDate } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { normalizeProduct } from "../utils/normalize";

function StarIcon({ active = false, className = "h-[18px] w-[18px]" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
    </svg>
  );
}

function RatingRow({ rating, reviewCount = null }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating ?? 0)));
  const filledStars = Math.round(normalizedRating);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-[#f3b33d]">
        {Array.from({ length: 5 }).map((_, index) => (
          <StarIcon
            key={index}
            active={index < filledStars}
            className="h-[18px] w-[18px]"
          />
        ))}
      </div>
      {reviewCount !== null ? (
        <span className="text-sm text-black/55">
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      ) : null}
    </div>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizeReviewSummary(payload, fallbackRating) {
  return {
    averageRating: Number(payload?.averageRating ?? fallbackRating ?? 0),
    reviewCount: Number(payload?.reviewCount ?? 0),
    reviews: Array.isArray(payload?.reviews) ? payload.reviews : [],
  };
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { startBuyNowCheckout } = useCheckoutSession();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviewSummary, setReviewSummary] = useState(() => normalizeReviewSummary(null, 4.8));
  const [error, setError] = useState("");
  const [reviewsError, setReviewsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsReviewsLoading(true);
    setError("");
    setReviewsError("");
    setReviewSummary(normalizeReviewSummary(null, 4.8));

    Promise.allSettled([
      catalogApi.getProduct(id),
      catalogApi.getRelatedProducts(id),
      catalogApi.getProductReviews(id),
    ])
      .then(([productResponse, relatedResponse, reviewResponse]) => {
        if (!isMounted) {
          return;
        }

        if (productResponse.status === "rejected") {
          setError(formatApiError(productResponse.reason));
          return;
        }

        const normalized = normalizeProduct(productResponse.value);
        setProduct(normalized);
        setSelectedImage(normalized.imageUrls[0]);
        setQuantity(1);
        setRelatedProducts(
          relatedResponse.status === "fulfilled" && Array.isArray(relatedResponse.value)
            ? relatedResponse.value
            : [],
        );

        if (reviewResponse.status === "fulfilled") {
          setReviewSummary(normalizeReviewSummary(reviewResponse.value, normalized.rating));
          return;
        }

        setReviewsError(formatApiError(reviewResponse.reason));
        setReviewSummary(normalizeReviewSummary(null, normalized.rating));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          setIsReviewsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    navigate("/cart");
  };

  const handleBuyNow = async () => {
    startBuyNowCheckout(product, quantity);
    navigate("/checkout/address");
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="That product is unavailable"
          message={error || "The requested product could not be found."}
          action={
            <Link to="/shop" className="btn btn-primary mt-6">
              Back to shop
            </Link>
          }
        />
      </section>
    );
  }

  const displayedRating =
    reviewSummary.reviewCount > 0 ? reviewSummary.averageRating : product.rating;
  const wishlisted = isWishlisted(product.id);
  const heroImage = getResponsiveImageProps(selectedImage, {
    widths: [480, 720, 960, 1200],
    quality: 74,
    sizes: "(min-width: 1280px) 500px, (min-width: 1024px) 42vw, 100vw",
  });
  const detailBullets = [
    `${product.category?.name ?? "Candle collection"} finish suitable for styling shelves and tables.`,
    `Scent notes: ${product.scentNotes}.`,
    `Estimated burn time: ${product.burnTime}.`,
  ];
  const lowStockThreshold = Number(product.lowStockThreshold ?? 10);
  const showLowStock = Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= lowStockThreshold;
  const hasScrollableReviews = reviewSummary.reviews.length > 3;
  const reviewBadgeLabel = reviewsError
    ? "Reviews unavailable"
    : `${reviewSummary.reviewCount} ${reviewSummary.reviewCount === 1 ? "review" : "reviews"}`;

  return (
    <section className="container-shell py-6 pb-28 sm:py-7 sm:pb-32 lg:py-5 lg:pb-8">
      <Link
        to="/shop"
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-black transition"
      >
        <span aria-hidden="true">&lt;</span>
        <span className="transition group-hover:underline group-hover:underline-offset-4">Back to shop</span>
      </Link>

      <div className="balanced-split-layout grid gap-4 lg:grid-cols-[92px_minmax(0,472px)_minmax(0,420px)] lg:gap-7 xl:grid-cols-[96px_minmax(0,500px)_minmax(0,432px)] xl:gap-9">
        <div className="order-2 grid grid-cols-3 gap-3 self-start lg:order-1 lg:grid-cols-1 lg:gap-3.5 lg:self-start">
          {product.imageUrls.map((imageUrl) => (
            <button
              key={imageUrl}
              type="button"
              onClick={() => setSelectedImage(imageUrl)}
              className={`aspect-[0.82] overflow-hidden rounded-[4px] border transition ${
                selectedImage === imageUrl
                  ? "border-black shadow-candle"
                  : "border-black/10 bg-white"
              }`}
            >
              <img
                {...getResponsiveImageProps(imageUrl, {
                  widths: [120, 180, 240],
                  quality: 64,
                  sizes: "104px",
                })}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(event) => applyImageFallback(event, fallbackProductImage)}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>

        <div className="balanced-split-media order-1 lg:order-2">
          <div className="balanced-split-frame aspect-[0.9] overflow-hidden rounded-[4px] border border-black/10 bg-white sm:aspect-[0.92] lg:aspect-[0.86] xl:aspect-[0.88]">
            <img
              src={heroImage.src}
              srcSet={heroImage.srcSet}
              sizes={heroImage.sizes}
              alt={product.name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={(event) => applyImageFallback(event, fallbackProductImage)}
              className="balanced-split-visual h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="order-3 max-w-[432px] space-y-3.5 text-left lg:pl-1">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="font-display text-heading-md font-semibold leading-[0.98] text-black">
                  {product.name}
                </h1>
              </div>
              <m.button
                type="button"
                title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => toggleWishlist(product)}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? "border-danger/30 bg-danger/10 text-danger"
                    : "border-black/10 text-black/45 hover:border-black hover:text-black"
                }`}
              >
                <m.span
                  key={wishlisted ? "wishlisted" : "not-wishlisted"}
                  initial={prefersReducedMotion ? false : { scale: 0.85, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <HeartIcon filled={wishlisted} />
                </m.span>
              </m.button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[2.05rem] font-semibold text-black">{formatCurrency(product.price)}</p>
              {product.originalPrice > product.price ? (
                <p className="text-sm text-black/35 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
              ) : null}
              <RatingRow rating={displayedRating} reviewCount={reviewSummary.reviewCount} />
            </div>
          </div>

          <div className="rounded-[18px] border border-black/10 bg-white px-4 py-3">
            <p className="text-sm leading-[1.7] text-black/72">{product.description}</p>
          </div>

          {showLowStock ? (
            <div className="rounded-[16px] border border-[#f1d28d] bg-[#fff6dd] px-4 py-3 text-sm font-medium text-[#1A1A1A]">
              Only {product.stock} left in stock.
            </div>
          ) : null}

          <ul className="space-y-1.25 text-sm leading-[1.5] text-black/70">
            {detailBullets.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <span className="mt-[8px] inline-flex h-1.5 w-1.5 rounded-full bg-black/45" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-2.5">
            <div className="grid gap-2.5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.25">
                <p className="text-sm font-semibold text-black">Quantity</p>
                <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                    className="px-4 py-2 text-lg"
                    aria-label="-"
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) =>
                        product.stock > 0 ? Math.min(current + 1, product.stock) : current,
                      )
                    }
                    disabled={product.stock <= quantity}
                    className="px-4 py-2 text-lg disabled:opacity-40"
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <m.button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.98 }}
              className="inline-flex h-[44px] w-full items-center justify-center rounded-[12px] bg-brand-primary px-6 text-sm font-semibold text-black transition hover:bg-[#dfa129] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </m.button>
            <m.button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.98 }}
              className="inline-flex h-[44px] w-full items-center justify-center rounded-[12px] bg-black px-6 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </m.button>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-2 text-sm text-black/56">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7H15V17H3Z" />
                <path d="M15 10H18.5L21 13V17H15Z" />
                <circle cx="7" cy="18" r="1.8" />
                <circle cx="18" cy="18" r="1.8" />
              </svg>
              <p>Free shipping on orders above ₹1999.</p>
            </div>
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3V7" />
                <path d="M12 17V21" />
                <path d="M4.9 4.9L7.7 7.7" />
                <path d="M16.3 16.3L19.1 19.1" />
                <path d="M3 12H7" />
                <path d="M17 12H21" />
                <path d="M4.9 19.1L7.7 16.3" />
                <path d="M16.3 7.7L19.1 4.9" />
                <circle cx="12" cy="12" r="4.2" />
              </svg>
              <p>Delivery within 3-7 working days.</p>
            </div>
          </div>
        </div>
      </div>

      <Reveal className="mt-14 border-t border-black/10 pt-12" delay={0.06}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-heading-sm font-semibold text-black">Reviews</h2>
            <p className="mt-2 text-sm leading-6 text-black/58">
              Read genuine customer feedback and add your own experience after trying this product.
            </p>
          </div>
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black">
            {reviewBadgeLabel}
          </div>
        </div>

        {isReviewsLoading ? (
          <div className="mt-8 rounded-[20px] border border-dashed border-black/12 px-6 py-10 text-sm leading-7 text-black/58">
            Loading reviews...
          </div>
        ) : reviewsError ? (
          <div className="mt-8 rounded-[20px] border border-dashed border-black/12 bg-[#fffaf0] px-6 py-8 text-sm leading-7 text-black/62">
            {reviewsError}
          </div>
        ) : (
          <div className="mt-8 max-w-[760px] space-y-4">
            <div className="rounded-[20px] border border-black/10 bg-white px-5 py-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45">
                Customer Rating
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <p className="font-display text-[2.2rem] font-semibold text-black">
                  {displayedRating.toFixed(1)}
                </p>
                <RatingRow rating={displayedRating} reviewCount={reviewSummary.reviewCount} />
              </div>
            </div>

            {reviewSummary.reviews.length ? (
              <div
                className={`space-y-4 ${
                  hasScrollableReviews
                    ? "mini-cart-scroll-view stealth-scrollbar max-h-[572px] touch-pan-y overflow-y-auto overscroll-contain pr-2 scroll-smooth"
                    : ""
                }`}
                data-lenis-prevent={hasScrollableReviews ? "true" : undefined}
                data-lenis-prevent-wheel={hasScrollableReviews ? "true" : undefined}
                data-lenis-prevent-touch={hasScrollableReviews ? "true" : undefined}
                tabIndex={hasScrollableReviews ? 0 : undefined}
              >
                {reviewSummary.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[18px] border border-black/10 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-black">{review.reviewerName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-black/42">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <RatingRow rating={review.rating} />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-black/68">{review.message}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-black/12 px-5 py-8 text-sm leading-7 text-black/58">
                No reviews yet. Be the first to share how this candle looked, smelled, and burned in your space.
              </div>
            )}
          </div>
        )}
      </Reveal>

      {relatedProducts.length ? (
        <Reveal className="mt-16 space-y-6" delay={0.1}>
          <h2 className="section-title">Similar Products</h2>
          <ProductSlider
            products={relatedProducts}
            arrowTopClass="top-[168px]"
            arrowLeftClass="-left-10 lg:-left-12"
            arrowRightClass="-right-10 lg:-right-12"
          />
        </Reveal>
      ) : null}

      <m.div
        initial={prefersReducedMotion ? false : { y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/96 px-4 py-3 shadow-[0_-12px_28px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-black">{product.name}</p>
            <p className="text-lg font-bold text-black">{formatCurrency(product.price)}</p>
          </div>
          <div className="rounded-full border border-black/10 px-3 py-2 text-sm font-semibold text-black">
            Qty {quantity}
          </div>
          <div className="flex items-center gap-2">
            <m.button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.97 }}
              className="btn btn-outline min-w-[132px] rounded-full px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Cart
            </m.button>
            <m.button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.97 }}
              className="btn btn-secondary min-w-[132px] rounded-full px-4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {product.stock > 0 ? "Buy Now" : "Out of Stock"}
            </m.button>
          </div>
        </div>
      </m.div>
    </section>
  );
}

export default ProductDetail;
