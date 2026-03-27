import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductDetailSkeleton from "../components/ProductDetailSkeleton";
import ProductSlider from "../components/ProductSlider";
import Reveal from "../components/Reveal";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { catalogApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

function RatingRow({ rating }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-[#f3b33d]">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg key={index} viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
            <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-black/55">({Math.max(1, Math.round(rating * 7))} review)</span>
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

const reviewCards = [
  {
    id: 1,
    name: "Aditi Sharma",
    text: "Loved the finish and the fragrance balance. It feels premium on a shelf and burns cleanly through the evening.",
  },
  {
    id: 2,
    name: "Riya Mehta",
    text: "The detailing is beautiful and it arrived well packed. It works really well as a gifting candle too.",
  },
];

const packOptions = [4, 6, 8];

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedPack, setSelectedPack] = useState(4);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([catalogApi.getProduct(id), catalogApi.getRelatedProducts(id)])
      .then(([productResponse, relatedResponse]) => {
        if (!isMounted) {
          return;
        }

        const normalized = normalizeProduct(productResponse);
        setProduct(normalized);
        setSelectedImage(normalized.imageUrls[0]);
        setQuantity(1);
        setSelectedPack(4);
        setRelatedProducts(relatedResponse ?? []);
      })
      .catch((productError) => {
        if (isMounted) {
          setError(formatApiError(productError));
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
  }, [id]);

  const handleAddToCart = async () => {
    await addToCart(product, quantity);
    navigate("/cart");
  };

  const handleBuyNow = async () => {
    await addToCart(product, quantity);
    navigate("/checkout");
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

  const totalPrice = product.price * quantity;
  const wishlisted = isWishlisted(product.id);
  const detailBullets = [
    `${product.category?.name ?? "Candle collection"} finish suitable for styling shelves and tables.`,
    `Scent notes: ${product.scentNotes}.`,
    `Estimated burn time: ${product.burnTime}.`,
  ];

  return (
    <section className="container-shell py-8 pb-28 sm:py-10 sm:pb-32 lg:pb-10">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-[12px] text-black/42">
        <Link to="/" className="transition hover:text-black">
          Shop Listing
        </Link>
        <span>/</span>
        <span className="text-black/62">{product.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[104px_minmax(0,500px)_minmax(0,380px)] lg:items-start lg:gap-12">
        <div className="order-2 grid grid-cols-3 gap-3 lg:order-1 lg:grid-cols-1 lg:gap-4">
          {product.imageUrls.map((imageUrl) => (
            <button
              key={imageUrl}
              type="button"
              onClick={() => setSelectedImage(imageUrl)}
              className={`overflow-hidden rounded-[4px] border transition ${
                selectedImage === imageUrl
                  ? "border-black shadow-candle"
                  : "border-black/10 bg-white"
              }`}
            >
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="aspect-[0.76] w-full object-cover"
              />
            </button>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-[4px] border border-black/10 bg-white">
            <img
              src={selectedImage}
              alt={product.name}
              loading="eager"
              decoding="async"
              className="aspect-[0.8] w-full object-cover"
            />
          </div>
        </div>

        <div className="order-3 max-w-[380px] space-y-6 lg:pl-1">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="font-display text-heading-md font-semibold leading-tight text-black">
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

            <div className="flex flex-wrap items-center gap-3">
                <p className="text-[2.05rem] font-semibold text-black">{formatCurrency(product.price)}</p>
                <RatingRow rating={product.rating} />
              {product.originalPrice > product.price && (
                <p className="text-sm text-black/35 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-black/10 pt-4">
            <p className="text-sm leading-8 text-black/72">{product.description}</p>
          </div>

          <ul className="space-y-1 text-sm leading-6 text-black/70">
            {detailBullets.map((detail) => (
              <li key={detail} className="flex items-start gap-2">
                <span className="mt-[8px] inline-flex h-1.5 w-1.5 rounded-full bg-black/45" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-black">Pack of</p>
                <div className="flex flex-wrap gap-3">
                  {packOptions.map((pack) => (
                    <button
                      key={pack}
                      type="button"
                      onClick={() => setSelectedPack(pack)}
                      className={`inline-flex min-w-[68px] items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition ${
                        selectedPack === pack
                          ? "border-black bg-black text-white"
                          : "border-black/12 bg-white text-black hover:border-black/30"
                      }`}
                    >
                      {pack}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:text-right">
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
              className="inline-flex h-[46px] w-full items-center justify-center rounded-[12px] bg-brand-primary px-6 text-sm font-semibold text-black transition hover:bg-[#dfa129] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </m.button>
            <m.button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.98 }}
              className="inline-flex h-[46px] w-full items-center justify-center rounded-[12px] bg-black px-6 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </m.button>
          </div>

          <div className="space-y-3 border-t border-black/10 pt-3 text-sm text-black/56">
            <div className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7H15V17H3Z" />
                <path d="M15 10H18.5L21 13V17H15Z" />
                <circle cx="7" cy="18" r="1.8" />
                <circle cx="18" cy="18" r="1.8" />
              </svg>
              <p>Free worldwide shipping on all orders over Rs.1999</p>
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
              <p>Delivers in: 3-7 Working Days <span className="underline underline-offset-2">Shipping &amp; Return</span></p>
            </div>
          </div>
        </div>
      </div>

      <Reveal className="mt-14 border-t border-black/10 pt-12" delay={0.06}>
        <div className="flex items-center gap-4 text-heading-sm font-medium text-black/58">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`transition ${
              activeTab === "description"
                ? "text-black"
                : "text-black/48 hover:text-black"
            }`}
          >
            Description
          </button>
          <span className="text-black/28">|</span>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`transition ${
              activeTab === "reviews"
                ? "text-black"
                : "text-black/48 hover:text-black"
            }`}
          >
            Reviews
          </button>
        </div>

        {activeTab === "description" ? (
          <div className="space-y-5 pt-8 text-sm leading-8 text-black/72">
            <p>{product.description}</p>
            <ul className="list-disc space-y-2 pl-5">
              {detailBullets.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-6 pt-8">
            <div className="space-y-5">
              {reviewCards.map((review) => (
                <article key={review.id} className="rounded-[12px] border border-black/10 bg-white px-5 py-4">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 inline-flex h-9 w-9 shrink-0 rounded-full bg-black/10" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-black">{review.name}</p>
                        <div className="shrink-0">
                          <RatingRow rating={4.8} />
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-black/68">{review.text}</p>
                      <p className="mt-3 text-sm text-black/52">Like &nbsp; Reply &nbsp; 5m</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <form className="rounded-[12px] border border-black/10 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-black">Your Name:</span>
                  <input className="input-pill h-[44px] rounded-full" placeholder="John Doe" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-black">Your Email:</span>
                  <input className="input-pill h-[44px] rounded-full" placeholder="person@gmail.com" />
                </label>
              </div>
              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-black">Your Message:</span>
                <textarea
                  rows="4"
                  className="w-full rounded-[16px] border border-black/15 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
                  placeholder="Write your review..."
                />
              </label>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-black/62">
                  <span>Your Ratings:</span>
                  <div className="flex items-center gap-0.5 text-black/38">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg key={index} viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn btn-secondary rounded-full px-7">
                  Post Review
                </button>
              </div>
            </form>
          </div>
        )}
      </Reveal>

      <Reveal className="mt-16 space-y-6" delay={0.1}>
        <h2 className="section-title">Similar Products</h2>
        <ProductSlider
          products={relatedProducts}
          arrowTopClass="top-[168px]"
          arrowLeftClass="-left-10 lg:-left-12"
          arrowRightClass="-right-10 lg:-right-12"
        />
      </Reveal>

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
          <m.button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            whileTap={prefersReducedMotion || product.stock <= 0 ? undefined : { scale: 0.97 }}
            className="btn btn-secondary min-w-[160px] rounded-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
          </m.button>
        </div>
      </m.div>
    </section>
  );
}

export default ProductDetail;
