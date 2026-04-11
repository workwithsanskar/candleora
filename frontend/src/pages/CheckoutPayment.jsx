import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CandleCheckbox from "../components/CandleCheckbox";
import CheckoutPriceSummary from "../components/checkout/CheckoutPriceSummary";
import CouponCodePanel from "../components/checkout/CouponCodePanel";
import CheckoutTimerBanner from "../components/checkout/CheckoutTimerBanner";
import PrimaryButton from "../components/checkout/PrimaryButton";
import StickyCTA from "../components/checkout/StickyCTA";
import StatusView from "../components/StatusView";
import CheckoutSkeleton from "../components/CheckoutSkeleton";
import { useAddresses } from "../context/AddressContext";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import { useCouponFlow } from "../hooks/useCouponFlow";
import { orderApi, paymentApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { loadRazorpayScript } from "../utils/razorpay";

const acceptedModes = ["UPI", "Cards", "Wallets", "Net Banking"];

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 text-black/45 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidePanel({ title, subtitle = "", open, onToggle, children }) {
  return (
    <div className="checkout-panel overflow-hidden rounded-[20px]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-black/50">{subtitle}</p> : null}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open ? <div className="border-t border-black/8 px-5 py-4">{children}</div> : null}
    </div>
  );
}

function PaymentChoiceCard({
  selected,
  title,
  subtitle,
  badge = "",
  highlight = "",
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[18px] border px-5 py-4 text-left transition ${
        selected
          ? "border-[#f1b85a] bg-[#fff8ef] shadow-[0_0_0_1px_rgba(241,184,90,0.14)]"
          : "border-black/10 bg-white hover:border-[#f1b85a]"
      }`}
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
            {badge ? (
              <span className="rounded-full border border-[#f1d7a1] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a56a00]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-black/60">{subtitle}</p>
          {highlight ? (
            <p className="mt-1.5 text-sm font-semibold text-success">{highlight}</p>
          ) : null}
        </div>
        <span
          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? "border-[#f1b85a] bg-brand-primary text-brand-dark"
              : "border-black/20 bg-white text-transparent"
          }`}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function CheckoutPayment() {
  const navigate = useNavigate();
  const { items: cartItems, hasHydrated, refreshCart } = useCart();
  const { addresses, isLoading: isAddressesLoading } = useAddresses();
  const {
    hasActiveSession,
    session,
    startCartCheckout,
    applyCoupon,
    clearCoupon,
    setPaymentMethod,
    setWhatsappOptIn,
    refreshPromotions,
    buildOrderPayload,
    rememberCompletedOrder,
    resetSession,
  } = useCheckoutSession();
  const {
    couponCode,
    setCouponCode,
    couponError,
    isApplyingCoupon,
    handleCouponApply,
    handleCouponRemove,
  } = useCouponFlow({
    session,
    items: session.items,
    applyCoupon,
    clearCoupon,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirectingToConfirmation, setIsRedirectingToConfirmation] = useState(false);
  const [openPanels, setOpenPanels] = useState({
    delivery: true,
    items: false,
  });

  useEffect(() => {
    if (isRedirectingToConfirmation) {
      return;
    }

    if (hasActiveSession && session.items.length) {
      return;
    }

    if (!hasHydrated) {
      return;
    }

    if (cartItems.length) {
      startCartCheckout(cartItems);
      return;
    }

    navigate("/cart", { replace: true });
  }, [
    cartItems,
    hasActiveSession,
    hasHydrated,
    isRedirectingToConfirmation,
    navigate,
    session.items.length,
    startCartCheckout,
  ]);

  useEffect(() => {
    if (isRedirectingToConfirmation) {
      return;
    }

    if (!session.addressCompleted || !session.addressId) {
      navigate("/checkout/address", { replace: true });
      return;
    }

    if (!session.paymentMethod) {
      setPaymentMethod("UPI");
    }
  }, [
    isRedirectingToConfirmation,
    navigate,
    session.addressCompleted,
    session.addressId,
    session.paymentMethod,
    setPaymentMethod,
  ]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => String(address.id) === String(session.addressId)) ?? null,
    [addresses, session.addressId],
  );

  const uiMethod = session.paymentMethod === "COD" ? "COD" : "ONLINE";
  const isOnlineSelected = uiMethod === "ONLINE";

  const lowStockNotice = useMemo(() => {
    const match = session.items.find((item) => {
      const stock = Number(item.stockSnapshot ?? 0);
      const threshold = Number(item.lowStockThresholdSnapshot ?? 10);
      return stock > 0 && stock <= threshold;
    });

    return match ? `Only ${match.stockSnapshot} left for ${match.productName}.` : "";
  }, [session.items]);

  const paymentCopy = useMemo(() => {
    if (!isOnlineSelected) {
      return session.coupon?.quote?.discountAmount
        ? "Your coupon savings stay applied even if you pay on delivery."
        : "Cash on delivery stays available when you would rather pay on arrival.";
    }

    return session.coupon?.quote?.discountAmount
      ? `Your savings of ${formatCurrency(session.priceSummary.savings)} stay locked in with this secure online checkout.`
      : "Secure online checkout powered by Razorpay. You'll choose UPI, card, wallet, or bank in the secure sheet after continuing.";
  }, [isOnlineSelected, session.coupon?.quote?.discountAmount, session.priceSummary.savings]);

  const footerCtaLabel = isSubmitting
    ? !isOnlineSelected
      ? "Processing Payment..."
      : "Processing Payment..."
    : !isOnlineSelected
      ? "Place Your Order"
      : `Proceed to Pay ${formatCurrency(session.priceSummary.total)}`;

  const mobileCtaLabel = isSubmitting
    ? "Processing Payment..."
    : !isOnlineSelected
      ? "Place Your Order"
      : `Proceed to Pay ${formatCurrency(session.priceSummary.total)}`;

  const togglePanel = (key) =>
    setOpenPanels((current) => ({
      ...current,
      [key]: !current[key],
    }));

  const proceedToOrderConfirmation = (order) => {
    const confirmedOrderId = Number(order?.id ?? 0);

    if (!confirmedOrderId) {
      throw new Error("The order confirmation page needs a valid order id.");
    }

    setIsRedirectingToConfirmation(true);
    rememberCompletedOrder(confirmedOrderId);
    navigate(`/order-confirmation/${confirmedOrderId}`, {
      replace: true,
      state: { orderId: confirmedOrderId },
    });
    resetSession();
    void refreshCart().catch(() => null);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      navigate("/checkout/address");
      return;
    }

    if (!session.paymentMethod) {
      setError("Choose a payment method before continuing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = buildOrderPayload(selectedAddress);

      if (!isOnlineSelected) {
        const order = await orderApi.createOrder(payload);
        proceedToOrderConfirmation(order);
        return;
      }

      await loadRazorpayScript();
      const razorpayOrder = await paymentApi.createRazorpayOrder(payload);

      const razorpay = new window.Razorpay({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "CandleOra",
        description: "Secure your CandleOra order",
        order_id: razorpayOrder.razorpayOrderId,
        prefill: {
          name: razorpayOrder.customerName,
          email: razorpayOrder.customerEmail,
          contact: razorpayOrder.customerPhone,
        },
        theme: { color: "#1b75bc" },
        modal: {
          ondismiss: () => {
            setError("The payment window was closed before the order could be secured.");
            setIsSubmitting(false);
          },
        },
        handler: async (response) => {
          try {
            const order = await paymentApi.verifyRazorpayPayment({
              orderId: razorpayOrder.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            proceedToOrderConfirmation(order);
          } catch (verifyError) {
            setError(formatApiError(verifyError));
            setIsSubmitting(false);
          }
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed before CandleOra could confirm the order.");
        setIsSubmitting(false);
      });

      razorpay.open();
    } catch (submitError) {
      setError(formatApiError(submitError));
      setIsSubmitting(false);
    }
  };

  if (isRedirectingToConfirmation) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Opening your confirmation"
          message="Taking you to the order confirmation page now."
        />
      </section>
    );
  }

  if (!hasActiveSession || !session.items.length || (!selectedAddress && !isAddressesLoading)) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Payment step unavailable"
          message="Complete the address step before choosing how to pay."
          action={
            <Link to="/checkout/address" className="btn btn-primary mt-6">
              Back to address
            </Link>
          }
        />
      </section>
    );
  }

  if (!selectedAddress || !hasActiveSession) {
    return (
      <section className="container-shell py-10 sm:py-12">
        <CheckoutSkeleton />
      </section>
    );
  }

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="space-y-4">
        <div className="space-y-3">
          <Link
            to="/checkout/address"
            className="inline-flex items-center gap-2 text-sm font-semibold text-black transition hover:underline hover:underline-offset-4"
          >
            <span aria-hidden="true">&lt;</span>
            <span>Back to Address</span>
          </Link>
          <h1 className="page-title">Payment</h1>
          <p className="page-subtitle max-w-[760px]">
            Choose your payment method.
          </p>
        </div>

        <CheckoutTimerBanner timerExpiry={session.timerExpiry} onExpire={refreshPromotions} />

        {lowStockNotice ? (
          <div className="checkout-banner px-4 py-3 text-sm font-medium">
            {lowStockNotice}
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div
          data-testid="checkout-payment-frame"
          className="checkout-panel space-y-4 overflow-hidden rounded-[24px] px-5 py-6 sm:px-7"
        >
          <p className="text-sm leading-6 text-black/58">Select a payment option to complete your order.</p>

          <div className="space-y-3">
            <PaymentChoiceCard
              selected={isOnlineSelected}
              title="Online Payment"
              subtitle="Secure online payment powered by Razorpay."
              badge="Recommended"
              highlight={
                session.priceSummary.savings > 0
                  ? `Savings stay locked in: ${formatCurrency(session.priceSummary.savings)}`
                  : ""
              }
              onClick={() => {
                setPaymentMethod("UPI");
                setError("");
              }}
            />

            <PaymentChoiceCard
              selected={!isOnlineSelected}
              title="Cash on Delivery"
              subtitle="Pay when your order arrives at your doorstep."
              onClick={() => {
                setPaymentMethod("COD");
                setError("");
              }}
            />
          </div>

          <div className="checkout-soft-panel px-5 py-4.5">
            <p className="text-sm font-semibold text-brand-dark">
              {isOnlineSelected ? "Online Payment Selected" : "Cash on Delivery Selected"}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-black/60">{paymentCopy}</p>

            <div className="mt-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(isOnlineSelected ? acceptedModes : ["Pay on delivery"]).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/58"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <label className="flex items-center gap-3 text-sm text-black/68">
                <CandleCheckbox
                  checked={Boolean(session.whatsappOptIn)}
                  onChange={(event) => setWhatsappOptIn(event.target.checked)}
                  className="h-4 w-4"
                />
                Get Order Updates on WhatsApp
              </label>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

          <PrimaryButton className="w-full" onClick={placeOrder} disabled={isSubmitting}>
            {footerCtaLabel}
          </PrimaryButton>
        </div>

        <div data-testid="checkout-payment-sidebar" className="space-y-3">
          <SidePanel
            title="Delivering to"
            subtitle=""
            open={openPanels.delivery}
            onToggle={() => togglePanel("delivery")}
          >
            <div className="space-y-4">
              <div className="space-y-1.5 text-sm leading-6 text-black/62">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b27d1d]">
                    Delivery details
                  </span>
                  <Link to="/checkout/address" className="text-sm font-semibold text-[#a56a00] hover:underline">
                    Change
                  </Link>
                </div>
                <p className="font-semibold leading-6 text-brand-dark">{selectedAddress.recipientName}</p>
                <p>{selectedAddress.addressLine1}</p>
                {selectedAddress.addressLine2 ? <p>{selectedAddress.addressLine2}</p> : null}
                <p>
                  {[selectedAddress.city, selectedAddress.state, selectedAddress.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>{selectedAddress.phoneNumber}</p>
              </div>

              <div className="border-t border-black/8 pt-3">
                <CouponCodePanel
                  couponCode={couponCode}
                  isApplying={isApplyingCoupon}
                  couponError={couponError}
                  appliedCoupon={
                    session.coupon?.quote
                      ? { code: session.coupon.code, message: session.coupon.quote.message }
                      : null
                  }
                  onCouponCodeChange={setCouponCode}
                  onApplyCoupon={handleCouponApply}
                  onRemoveCoupon={handleCouponRemove}
                  subtotalAmount={session.priceSummary.subtotal}
                />
              </div>
            </div>
          </SidePanel>

          <SidePanel
            title={`Items (${session.items.length})`}
            subtitle="Review what will be packed"
            open={openPanels.items}
            onToggle={() => togglePanel("items")}
          >
            <div className="space-y-3">
              {session.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex items-start justify-between gap-4 border-b border-black/8 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                    <p className="mt-1 text-sm text-black/56">
                      Qty {item.quantity}
                      {item.variantLabel ? ` | ${item.variantLabel}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-black/54">
                    {formatCurrency(Number(item.lineTotal ?? Number(item.price) * Number(item.quantity ?? 1)))}
                  </span>
                </div>
              ))}
            </div>
          </SidePanel>

          <CheckoutPriceSummary
            summary={session.priceSummary}
            itemCount={session.items.length}
            sticky
          />
        </div>
      </div>

      <StickyCTA
        totalLabel={formatCurrency(session.priceSummary.total)}
        secondaryCopy={isOnlineSelected ? "Online payment via Razorpay" : "Cash on delivery"}
        primaryAction={
          <PrimaryButton onClick={placeOrder} disabled={isSubmitting}>
            {mobileCtaLabel}
          </PrimaryButton>
        }
      />
    </section>
  );
}

export default CheckoutPayment;
