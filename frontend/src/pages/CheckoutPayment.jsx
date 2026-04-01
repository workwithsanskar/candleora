import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CheckoutTimerBanner from "../components/checkout/CheckoutTimerBanner";
import PrimaryButton from "../components/checkout/PrimaryButton";
import StickyCTA from "../components/checkout/StickyCTA";
import StatusView from "../components/StatusView";
import { useAddresses } from "../context/AddressContext";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import { orderApi, paymentApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { loadRazorpayScript } from "../utils/razorpay";

const acceptedModes = ["UPI", "Cards", "Wallets", "Net banking"];

const trustHighlights = [
  {
    id: "genuine",
    lines: ["100% genuine", "product"],
  },
  {
    id: "secure",
    lines: ["100% secure", "payment"],
  },
  {
    id: "returns",
    lines: ["Easy returns &", "instant refunds"],
  },
];

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

function TrustIcon({ index }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3.5L18.5 6.5V12.5C18.5 16.2 15.9 19.4 12 20.5C8.1 19.4 5.5 16.2 5.5 12.5V6.5L12 3.5Z" />
        <path d="M9.5 12.5L11.2 14.2L14.8 10.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="6" width="16" height="12" rx="2.5" />
        <path d="M4 10H20" />
        <path d="M8 15H11.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.5 9L12 5.5L17.5 9V15L12 18.5L6.5 15V9Z" />
      <path d="M6.5 9L12 12.5L17.5 9" />
      <path d="M12 12.5V18.5" />
    </svg>
  );
}

function SidePanel({ title, subtitle = "", open, onToggle, children }) {
  return (
    <div className="checkout-panel overflow-hidden rounded-[20px]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
      >
        <div>
          <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-black/50">{subtitle}</p> : null}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open ? <div className="border-t border-black/8 px-5 py-5">{children}</div> : null}
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
      className={`w-full rounded-[18px] border px-5 py-5 text-left transition ${
        selected
          ? "border-[#f1b85a] bg-[#fff8ef] shadow-[0_0_0_1px_rgba(241,184,90,0.14)]"
          : "border-black/10 bg-white hover:border-[#f1b85a]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-brand-dark">{title}</h2>
            {badge ? (
              <span className="rounded-full border border-[#f1d7a1] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a56a00]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-black/60">{subtitle}</p>
          {highlight ? (
            <p className="mt-2 text-sm font-semibold text-success">{highlight}</p>
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
    setPaymentMethod,
    setWhatsappOptIn,
    refreshPromotions,
    buildOrderPayload,
    rememberCompletedOrder,
    resetSession,
  } = useCheckoutSession();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPanels, setOpenPanels] = useState({
    delivery: true,
    items: false,
    summary: true,
  });

  useEffect(() => {
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
  }, [cartItems, hasActiveSession, hasHydrated, navigate, session.items.length, startCartCheckout]);

  useEffect(() => {
    if (!session.addressCompleted || !session.addressId) {
      navigate("/checkout/address", { replace: true });
      return;
    }

    if (!session.paymentMethod) {
      setPaymentMethod("UPI");
    }
  }, [navigate, session.addressCompleted, session.addressId, session.paymentMethod, setPaymentMethod]);

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
      ? "Securing order..."
      : "Opening payment..."
    : !isOnlineSelected
      ? "Place order"
      : `Pay ${formatCurrency(session.priceSummary.total)}`;

  const mobileCtaLabel = isSubmitting
    ? !isOnlineSelected
      ? "Securing..."
      : "Opening..."
    : !isOnlineSelected
      ? "Place order"
      : "Pay now";

  const togglePanel = (key) =>
    setOpenPanels((current) => ({
      ...current,
      [key]: !current[key],
    }));

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
        rememberCompletedOrder(order.id);
        await refreshCart().catch(() => null);
        resetSession();
        navigate(`/order-confirmation/${order.id}`, {
          replace: true,
          state: { orderId: order.id },
        });
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

            rememberCompletedOrder(order.id);
            await refreshCart().catch(() => null);
            resetSession();
            navigate(`/order-confirmation/${order.id}`, {
              replace: true,
              state: { orderId: order.id },
            });
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

  if (!selectedAddress) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Preparing your payment step"
          message="Loading your delivery details and order summary."
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="checkout-kicker">Payment step</p>
          <h1 className="page-title">Choose your payment method</h1>
          <p className="page-subtitle max-w-[760px]">
            Select one of the two final payment options and complete the order through Razorpay or on delivery.
          </p>
        </div>

        <CheckoutTimerBanner timerExpiry={session.timerExpiry} onExpire={refreshPromotions} />

        {lowStockNotice ? (
          <div className="checkout-banner px-4 py-3 text-sm font-medium">
            {lowStockNotice}
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div
          data-testid="checkout-payment-frame"
          className="checkout-panel space-y-5 overflow-hidden rounded-[24px] px-5 py-6 sm:px-7"
        >
          <div className="checkout-soft-panel px-4 py-3 text-center text-sm font-medium text-brand-dark">
            Trusted by CandleOra customers
          </div>

          <div className="space-y-4">
            <PaymentChoiceCard
              selected={isOnlineSelected}
              title="Online payment"
              subtitle="Continue to Razorpay and choose UPI, cards, wallets, or net banking in one secure payment sheet."
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
              title="Cash on delivery"
              subtitle="Confirm the order now and pay when your package arrives at your doorstep."
              onClick={() => {
                setPaymentMethod("COD");
                setError("");
              }}
            />
          </div>

          <div className="checkout-soft-panel px-5 py-5">
            <p className="text-sm font-semibold text-brand-dark">
              {isOnlineSelected ? "Online payment selected" : "Cash on delivery selected"}
            </p>
            <p className="mt-2 text-sm leading-7 text-black/60">{paymentCopy}</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(isOnlineSelected ? acceptedModes : ["Pay on delivery"]).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#f1d7a1] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/58"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <label className="flex items-center gap-3 text-sm text-black/68">
                <input
                  type="checkbox"
                  checked={Boolean(session.whatsappOptIn)}
                  onChange={(event) => setWhatsappOptIn(event.target.checked)}
                  className="h-4 w-4 rounded border-[#f1b85a] text-brand-primary"
                />
                WhatsApp updates
              </label>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

          <PrimaryButton className="w-full" onClick={placeOrder} disabled={isSubmitting}>
            {footerCtaLabel}
          </PrimaryButton>
        </div>

        <div data-testid="checkout-payment-sidebar" className="space-y-4">
          <SidePanel
            title={`Delivering order to ${selectedAddress.recipientName}`}
            subtitle={selectedAddress.label ? selectedAddress.label : "Selected address"}
            open={openPanels.delivery}
            onToggle={() => togglePanel("delivery")}
          >
            <div className="space-y-2 text-sm leading-6 text-black/62">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedAddress.label ? (
                    <span className="rounded-[8px] border border-[#f1d7a1] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a56a00]">
                      {selectedAddress.label}
                    </span>
                  ) : null}
                </div>
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
          </SidePanel>

          <SidePanel
            title={`Items (${session.items.length})`}
            subtitle="Review what will be packed"
            open={openPanels.items}
            onToggle={() => togglePanel("items")}
          >
            <div className="space-y-4">
              {session.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="checkout-soft-panel rounded-[16px] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                      <p className="mt-1 text-sm text-black/56">
                        Qty {item.quantity}
                        {item.variantLabel ? ` | ${item.variantLabel}` : ""}
                      </p>
                    </div>
                    {item.stockSnapshot ? (
                      <span className="shrink-0 rounded-full border border-[#f1d7a1] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a56a00]">
                        Stock {item.stockSnapshot}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </SidePanel>

          <SidePanel
            title="Price Summary"
            subtitle={`${session.items.length} item${session.items.length === 1 ? "" : "s"}`}
            open={openPanels.summary}
            onToggle={() => togglePanel("summary")}
          >
            <div className="space-y-4">
              <div className="space-y-3 text-sm text-black/64">
                <div className="flex items-center justify-between">
                  <span>Product total</span>
                  <span>{formatCurrency(session.priceSummary.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total discounts</span>
                  <span className={session.priceSummary.discount > 0 ? "text-success" : ""}>
                    {session.priceSummary.discount > 0
                      ? `-${formatCurrency(session.priceSummary.discount)}`
                      : formatCurrency(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className={session.priceSummary.shipping === 0 ? "text-success" : ""}>
                    {session.priceSummary.shipping === 0
                      ? "Free"
                      : formatCurrency(session.priceSummary.shipping)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/8 pt-4">
                <span className="text-base font-semibold text-brand-dark">Total</span>
                <span className="font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-brand-dark">
                  {formatCurrency(session.priceSummary.total)}
                </span>
              </div>

              {session.priceSummary.savings > 0 ? (
                <div className="checkout-banner-success px-4 py-3 text-sm font-medium">
                  You're saving {formatCurrency(session.priceSummary.savings)} on this order.
                </div>
              ) : (
                <div className="checkout-banner-success px-4 py-3 text-sm font-medium">
                  Free delivery is already included with this order.
                </div>
              )}
            </div>
          </SidePanel>

          <div className="checkout-panel overflow-hidden rounded-[20px]">
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 xl:grid-cols-3">
              {trustHighlights.map((item, index) => (
                <div
                  key={item.id}
                  className="flex min-h-[108px] flex-col items-center justify-start gap-3 text-center"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff6df] text-[#8a6a2f]">
                    <TrustIcon index={index} />
                  </div>
                  <p className="max-w-[140px] text-[11px] font-semibold uppercase leading-5 tracking-[0.14em] text-black/52">
                    {item.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
