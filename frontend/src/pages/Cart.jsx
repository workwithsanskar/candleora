import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import fallbackImage from "../assets/designer/image-optimized.webp";
import Modal from "../components/Modal";
import CheckoutPriceSummary from "../components/checkout/CheckoutPriceSummary";
import CouponCodePanel from "../components/checkout/CouponCodePanel";
import PrimaryButton from "../components/checkout/PrimaryButton";
import QuantityControl from "../components/checkout/QuantityControl";
import StickyCTA from "../components/checkout/StickyCTA";
import ProductSlider from "../components/ProductSlider";
import StatusView from "../components/StatusView";
import CartSkeleton from "../components/CartSkeleton";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import { useWishlist } from "../context/WishlistContext";
import { useCouponFlow } from "../hooks/useCouponFlow";
import { catalogApi } from "../services/api";
import { formatCurrency } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { getProductPath } from "../utils/normalize";

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function createWishlistProduct(item) {
  return {
    id: item.productId ?? item.id,
    slug: item.slug,
    name: item.productName,
    price: item.unitPrice,
    originalPrice: item.originalUnitPrice,
    stock: item.stock,
    imageUrl: item.imageUrl,
    occasionTag: item.occasionTag,
    category: { name: item.occasionTag || "CandleOra" },
  };
}

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, grandTotal, updateQuantity, removeFromCart, isLoading, error } = useCart();
  const { addToWishlist, isWishlisted, toggleWishlist } = useWishlist();
  const {
    session,
    startCartCheckout,
    syncCartItems,
    applyCoupon,
    clearCoupon,
  } = useCheckoutSession();
  const [recommendations, setRecommendations] = useState([]);
  const {
    couponCode,
    setCouponCode,
    couponError,
    isApplyingCoupon,
    handleCouponApply,
    handleCouponRemove,
  } = useCouponFlow({
    session,
    items,
    applyCoupon,
    clearCoupon,
  });
  const [pendingRemovalItem, setPendingRemovalItem] = useState(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    if (session.source === "cart") {
      syncCartItems(items);
      return;
    }

    startCartCheckout(items);
  }, [items, session.source, startCartCheckout, syncCartItems]);

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

  const visibleRecommendations = useMemo(() => {
    const cartProductIds = new Set(items.map((item) => Number(item.productId ?? item.id)));

    return recommendations.filter(
      (product) => !cartProductIds.has(Number(product.id ?? product.productId)),
    );
  }, [items, recommendations]);

  const effectiveSummary = session.source === "cart"
    ? session.priceSummary
    : {
        subtotal: grandTotal,
        discount: 0,
        shipping: 0,
        total: grandTotal,
        savings: 0,
      };

  const handleProceed = () => {
    if (!items.length) {
      return;
    }

    startCartCheckout(items);
    navigate("/checkout/address");
  };

  const openRemoveModal = (item) => {
    setPendingRemovalItem(item);
  };

  const closeRemoveModal = () => {
    if (isRemovingItem) {
      return;
    }

    setPendingRemovalItem(null);
  };

  const handleDecreaseQuantity = (item) => {
    if (Number(item.quantity) <= 1) {
      openRemoveModal(item);
      return;
    }

    updateQuantity(item.id, Number(item.quantity) - 1);
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemovalItem) {
      return;
    }

    setIsRemovingItem(true);
    try {
      await removeFromCart(pendingRemovalItem.id);
      setPendingRemovalItem(null);
    } finally {
      setIsRemovingItem(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!pendingRemovalItem) {
      return;
    }

    setIsRemovingItem(true);
    try {
      addToWishlist(createWishlistProduct(pendingRemovalItem));
      await removeFromCart(pendingRemovalItem.id);
      setPendingRemovalItem(null);
    } finally {
      setIsRemovingItem(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <m.section
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="container-shell py-10 sm:py-12"
        >
          <div className="space-y-6 mb-8">
            <h1 className="page-title">My Cart</h1>
          </div>
          <CartSkeleton />
        </m.section>
      ) : error ? (
        <m.section
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="container-shell py-16"
        >
          <StatusView title="Bag unavailable" message={error} />
        </m.section>
      ) : !items.length ? (
        <m.section
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="container-shell py-16"
        >
          <StatusView
            title="Nothing in your cart yet"
            message="Find something you love and add it here."
            action={(
              <Link to="/shop" className="btn btn-primary mt-6">
                Start shopping
              </Link>
            )}
          />
        </m.section>
      ) : (
        <m.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <section className="container-shell py-10 sm:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="page-title">
                    My Cart ({items.length} {items.length === 1 ? "item" : "items"})
                  </h1>
                  <p className="page-subtitle max-w-[760px]">
                    Review your items and proceed to checkout.
                  </p>
                </div>

                <div className={`space-y-4 ${items.length > 3 ? "mini-cart-scroll-view max-h-[940px] overflow-y-auto pr-2" : ""}`}>
                  {items.map((item) => {
                    const isAvailable = item.stock == null || Number(item.stock) > 0;
                    const wishlistProduct = createWishlistProduct(item);

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_18px_34px_rgba(0,0,0,0.05)] sm:p-5"
                      >
                      <div className="grid gap-5 md:grid-cols-[24px_170px_minmax(0,1fr)_136px] md:items-start">
                        <button
                          type="button"
                          onClick={() => openRemoveModal(item)}
                          className="text-2xl leading-none text-black/52 transition hover:text-danger"
                          aria-label={`Remove ${item.productName} from bag`}
                        >
                          &times;
                        </button>

                        <Link
                          to={getProductPath({ id: item.productId, slug: item.slug, name: item.productName })}
                          className="relative self-start overflow-hidden rounded-[22px] bg-[#F2ECE2]"
                        >
                          <img
                            {...getResponsiveImageProps(item.imageUrl, {
                              widths: [220, 320, 420],
                              quality: 64,
                              sizes: "(min-width: 1024px) 170px, 120px",
                            })}
                            alt={item.productName}
                            loading="lazy"
                            decoding="async"
                            onError={(event) => applyImageFallback(event, fallbackImage)}
                            className="aspect-[0.92] h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleWishlist(wishlistProduct);
                            }}
                            className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/92 transition ${
                              isWishlisted(item.productId)
                                ? "text-danger"
                                : "text-black/45 hover:text-danger"
                            }`}
                          >
                            <HeartIcon filled={isWishlisted(item.productId)} />
                          </button>
                        </Link>

                        <div className="flex min-w-0 flex-col justify-between gap-5">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-black/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72">
                                {item.occasionTag || "CandleOra"}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                  isAvailable
                                    ? "bg-[#eef7ee] text-[#2d7d32]"
                                    : "bg-[#fff1f1] text-[#c62828]"
                                }`}
                              >
                                {isAvailable ? "In Stock" : "Out of Stock"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <Link
                                to={getProductPath({ id: item.productId, slug: item.slug, name: item.productName })}
                                className="block"
                              >
                                <h2 className="text-[1.2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-black transition hover:underline hover:underline-offset-4 sm:text-[1.35rem]">
                                  {item.productName}
                                </h2>
                              </Link>
                              <p
                                className={`max-w-[520px] text-sm leading-6 ${
                                  isAvailable ? "text-black/62" : "font-medium text-[#c93232]"
                                }`}
                              >
                                {isAvailable
                                  ? "Get it within 3-6 delivery days."
                                  : "This item is currently unavailable, saved in for later."}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <QuantityControl
                              value={item.quantity}
                              compact
                              onDecrease={() => handleDecreaseQuantity(item)}
                              onIncrease={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                            />
                            <p className="text-sm font-medium text-black/62">
                              {formatCurrency(item.unitPrice)} each
                            </p>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#1f8a3d]">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <path d="M3 7H15V17H3Z" />
                                <path d="M15 10H18.5L21 13V17H15Z" />
                                <circle cx="7" cy="18" r="1.8" />
                                <circle cx="18" cy="18" r="1.8" />
                              </svg>
                              Free delivery applied to your order.
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-left md:text-right">
                          <p className="text-[2.15rem] font-semibold leading-none tracking-[-0.05em] text-[#1A1A1A]">
                            {formatCurrency(item.lineTotal)}
                          </p>
                          {Number(item.originalUnitPrice ?? item.unitPrice) > Number(item.unitPrice) ? (
                            <p className="text-sm text-black/40 line-through">
                              {formatCurrency(item.originalUnitPrice)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <CouponCodePanel
                  couponCode={couponCode}
                  isApplying={isApplyingCoupon}
                  couponError={couponError}
                  appliedCoupon={session.coupon?.quote ? { code: session.coupon.code, message: session.coupon.quote.message } : null}
                  onCouponCodeChange={setCouponCode}
                  onApplyCoupon={handleCouponApply}
                  onRemoveCoupon={handleCouponRemove}
                  subtotalAmount={effectiveSummary.subtotal}
                />

                <CheckoutPriceSummary
                  summary={effectiveSummary}
                  itemCount={items.length}
                  title="Price Summary"
                  sticky
                  cta={isAuthenticated ? (
                    <PrimaryButton className="w-full" onClick={handleProceed}>
                      Continue to address
                    </PrimaryButton>
                  ) : (
                    <Link
                      to="/login"
                      state={{ from: { pathname: "/checkout/address" } }}
                      className="checkout-action-primary w-full text-center"
                    >
                      Sign in to continue
                    </Link>
                  )}
                  note=""
                />
              </div>
            </div>

            <StickyCTA
              totalLabel={formatCurrency(effectiveSummary.total)}
              secondaryCopy={effectiveSummary.savings > 0 ? `Saving ${formatCurrency(effectiveSummary.savings)}` : "Free delivery included"}
              primaryAction={isAuthenticated ? (
                <PrimaryButton onClick={handleProceed}>Continue</PrimaryButton>
              ) : (
                <Link
                  to="/login"
                  state={{ from: { pathname: "/checkout/address" } }}
                  className="checkout-action-primary"
                >
                  Sign in
                </Link>
              )}
            />

            <Modal
              isOpen={Boolean(pendingRemovalItem)}
              onClose={closeRemoveModal}
              title="Clear From Bag"
              maxWidthClass="max-w-[860px]"
              bodyScrollable={false}
              headerClassName="bg-white"
              titleClassName="text-[1.55rem] leading-none tracking-[-0.04em] sm:text-[1.8rem]"
            >
              {pendingRemovalItem ? (
                <div className="space-y-5">
                  <p className="text-[1.05rem] font-medium text-[#1A1A1A]">
                    Are you sure you want to remove this item from bag?
                  </p>

                  <div className="grid gap-4 rounded-[24px] border border-black/10 bg-white p-4 sm:grid-cols-[118px_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                    <div className="overflow-hidden rounded-[18px] bg-[#F2ECE2]">
                      <img
                        {...getResponsiveImageProps(pendingRemovalItem.imageUrl, {
                          widths: [180, 240, 320],
                          quality: 64,
                          sizes: "(min-width: 640px) 118px, 100vw",
                        })}
                        alt={pendingRemovalItem.productName}
                        loading="lazy"
                        decoding="async"
                        onError={(event) => applyImageFallback(event, fallbackImage)}
                        className="aspect-square h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[1.1rem] font-semibold text-[#1A1A1A]">
                        {pendingRemovalItem.occasionTag || "CandleOra"}
                      </p>
                      <p className="text-base text-black/68">{pendingRemovalItem.productName}</p>
                      <p
                        className={`text-sm font-medium ${
                          pendingRemovalItem.stock == null || Number(pendingRemovalItem.stock) > 0
                            ? "text-[#1f8a3d]"
                            : "text-[#c93232]"
                        }`}
                      >
                        {pendingRemovalItem.stock == null || Number(pendingRemovalItem.stock) > 0
                          ? "Get it within 3-6 delivery days."
                          : "This item is currently unavailable, saved in for later."}
                      </p>
                    </div>

                    <div className="space-y-1 text-left sm:text-right">
                      <p className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-[#1A1A1A]">
                        {formatCurrency(pendingRemovalItem.lineTotal)}
                      </p>
                      {Number(pendingRemovalItem.originalUnitPrice ?? pendingRemovalItem.unitPrice) > Number(pendingRemovalItem.unitPrice) ? (
                        <>
                          <p className="text-sm text-black/40 line-through">
                            {formatCurrency(pendingRemovalItem.originalUnitPrice)}
                          </p>
                          <p className="text-sm font-medium text-[#1f8a3d]">
                            You saved {formatCurrency(
                              Number(pendingRemovalItem.originalUnitPrice) - Number(pendingRemovalItem.unitPrice),
                            )}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleConfirmRemove}
                      disabled={isRemovingItem}
                      className="inline-flex min-h-[56px] items-center justify-center rounded-[16px] border border-black/12 bg-white px-6 text-base font-semibold uppercase tracking-[0.03em] text-[#1A1A1A] transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRemovingItem ? "Removing..." : "Remove"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveForLater}
                      disabled={isRemovingItem}
                      className="inline-flex min-h-[56px] items-center justify-center rounded-[16px] bg-brand-primary px-6 text-base font-semibold uppercase tracking-[0.03em] text-[#1A1A1A] transition hover:bg-[#dfa129] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRemovingItem ? "Saving..." : "Save For Later"}
                    </button>
                  </div>
                </div>
              ) : null}
            </Modal>

            {visibleRecommendations.length ? (
              <div className="space-y-5 pt-12">
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
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default Cart;
