import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import fallbackImage from "../assets/designer/image-optimized.jpg";
import CheckoutPriceSummary from "../components/checkout/CheckoutPriceSummary";
import CouponCodePanel from "../components/checkout/CouponCodePanel";
import PrimaryButton from "../components/checkout/PrimaryButton";
import QuantityControl from "../components/checkout/QuantityControl";
import StickyCTA from "../components/checkout/StickyCTA";
import ProductSlider from "../components/ProductSlider";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import { catalogApi, couponApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { getProductPath } from "../utils/normalize";

function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, grandTotal, updateQuantity, removeFromCart, isLoading, error } = useCart();
  const {
    session,
    startCartCheckout,
    syncCartItems,
    applyCoupon,
    clearCoupon,
  } = useCheckoutSession();
  const [recommendations, setRecommendations] = useState([]);
  const [couponCode, setCouponCode] = useState(() => session.coupon?.code ?? "");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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
    setCouponCode(session.coupon?.code ?? "");
  }, [session.coupon?.code]);

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

  const handleCouponApply = async (rawCode = couponCode) => {
    const code = String(rawCode ?? "").trim();
    if (!code) {
      setCouponError("Enter a coupon code to apply.");
      return;
    }

    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      const response = await couponApi.validate({
        code,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity ?? 1),
        })),
      });
      applyCoupon(response.code, response);
      setCouponCode(response.code);
    } catch (applyError) {
      setCouponError(formatApiError(applyError));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCouponRemove = () => {
    clearCoupon();
    setCouponCode("");
    setCouponError("");
  };

  const handleProceed = () => {
    if (!items.length) {
      return;
    }

    startCartCheckout(items);
    navigate("/checkout/address");
  };

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Refreshing bag" message="Pulling the latest CandleOra cart details." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Bag unavailable" message={error} />
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Your bag is empty"
          message="Browse the CandleOra collection and add a few favorites."
          action={(
            <Link to="/shop" className="btn btn-primary mt-6">
              Start shopping
            </Link>
          )}
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="checkout-kicker">Checkout review</p>
            <h1 className="page-title">
              My Bag ({items.length} {items.length === 1 ? "item" : "items"})
            </h1>
            <p className="page-subtitle max-w-[760px]">
              Review your selected pieces, adjust quantity, apply offers, and then continue into the redesigned checkout.
            </p>
          </div>

          {effectiveSummary.savings > 0 ? (
            <div className="checkout-banner-success px-5 py-4 text-base font-medium">
              You are saving {formatCurrency(effectiveSummary.savings)} on this order.
            </div>
          ) : (
            <div className="checkout-banner-success px-5 py-4 text-base font-medium">
              Free delivery is already included with this order.
            </div>
          )}

          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="checkout-panel grid gap-4 p-5 sm:grid-cols-[24px_120px_minmax(0,1fr)_170px] sm:items-start"
              >
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-2xl leading-none text-black/52 transition hover:text-danger"
                  aria-label={`Remove ${item.productName} from bag`}
                >
                  &times;
                </button>

                <Link
                  to={getProductPath({ id: item.productId, name: item.productName })}
                  className="overflow-hidden rounded-[22px] bg-[#F2ECE2]"
                >
                  <img
                    {...getResponsiveImageProps(item.imageUrl, {
                      widths: [180, 270, 360],
                      quality: 64,
                      sizes: "120px",
                    })}
                    alt={item.productName}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => applyImageFallback(event, fallbackImage)}
                    className="aspect-square h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">
                      CandleOra
                    </p>
                    <Link
                      to={getProductPath({ id: item.productId, name: item.productName })}
                      className="mt-2 block text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1A1A1A] sm:text-[1.55rem]"
                    >
                      {item.productName}
                    </Link>
                    <p className="mt-3 text-sm text-[#027808]">Get it within 3-6 delivery days</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityControl
                      value={item.quantity}
                      compact
                      onDecrease={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                      onIncrease={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                    />
                    <p className="rounded-full border border-[#f2d29a] px-4 py-2 text-sm text-black/62">
                      Unit price {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-left sm:text-right">
                  <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.05em] text-[#1A1A1A]">
                    {formatCurrency(item.lineTotal)}
                  </p>
                  {Number(item.originalUnitPrice ?? item.unitPrice) > Number(item.unitPrice) ? (
                    <p className="text-sm text-black/40 line-through">
                      {formatCurrency(item.originalUnitPrice)}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
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
          />

          <CheckoutPriceSummary
            summary={effectiveSummary}
            itemCount={items.length}
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
            note="Apply a coupon here before moving into address and payment."
            extraContent={(
              <div className="checkout-soft-panel p-4">
                <div className="grid gap-2 text-sm text-black/62">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#F1B85A]" />
                    <span>Quality assurance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#F1B85A]" />
                    <span>100% secure payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#F1B85A]" />
                    <span>Easy returns & instant refunds</span>
                  </div>
                </div>
              </div>
            )}
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
  );
}

export default Cart;
