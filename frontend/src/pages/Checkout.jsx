import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { orderApi, paymentApi } from "../services/api";
import { buildCheckoutPayload, createCheckoutForm } from "../utils/account";
import { formatApiError, formatCurrency } from "../utils/format";
import { getCurrentLocation } from "../utils/location";
import { loadRazorpayScript } from "../utils/razorpay";

const inputClassName =
  "w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 text-brand-dark outline-none transition focus:border-brand-primary/40 focus:bg-white dark:border-[#5b473b] dark:bg-[#1a1411] dark:text-brand-dark dark:placeholder:text-brand-dark/35 dark:focus:border-brand-primary/60 dark:focus:bg-[#241a15]";

const steps = [
  { id: 1, label: "Shipping" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Review" },
];

const requiredShippingFields = [
  "shippingName",
  "contactEmail",
  "phone",
  "addressLine1",
  "city",
  "state",
  "postalCode",
];

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, grandTotal, clearCart } = useCart();
  const [form, setForm] = useState(() => createCheckoutForm(user));
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm(createCheckoutForm(user));
    }
  }, [user]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validateShippingStep = () => {
    const missingField = requiredShippingFields.find((field) => !String(form[field] ?? "").trim());

    if (missingField) {
      setError("Complete the shipping address before continuing.");
      return false;
    }

    return true;
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setIsLocating(true);

    try {
      const location = await getCurrentLocation();
      setForm((current) => ({
        ...current,
        locationLabel: current.locationLabel || location.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }));
      toast.success("Current location attached.");
    } catch (locationError) {
      setError(formatApiError(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const goToNextStep = () => {
    setError("");

    if (step === 1 && !validateShippingStep()) {
      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, steps.length));
  };

  const goToPreviousStep = () => {
    setError("");
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const handlePlaceOrder = async () => {
    setError("");
    setIsSubmitting(true);
    const payload = buildCheckoutPayload(form, checkoutItems);

    try {
      if (form.paymentMethod === "COD") {
        const order = await orderApi.createOrder(payload);
        clearCart();
        toast.success("Order placed successfully.");
        navigate(`/order-confirmation/${order.id}`, { replace: true });
        return;
      }

      const razorpayOrder = await paymentApi.createRazorpayOrder(payload);
      const Razorpay = await loadRazorpayScript();

      const paymentResult = await new Promise((resolve, reject) => {
        const instance = new Razorpay({
          key: razorpayOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.razorpayOrderId,
          name: "CandleOra",
          description: `Order #${razorpayOrder.orderId}`,
          prefill: {
            name: razorpayOrder.customerName || form.shippingName,
            email: razorpayOrder.customerEmail || form.contactEmail,
            contact: razorpayOrder.customerPhone || form.phone,
          },
          theme: {
            color: "#C18C5D",
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled before completion.")),
          },
          handler: (response) => resolve(response),
        });

        instance.on("payment.failed", (response) => {
          reject(
            new Error(
              response?.error?.description || "Payment failed. Please try again.",
            ),
          );
        });

        instance.open();
      });

      const order = await paymentApi.verifyRazorpayPayment({
        orderId: razorpayOrder.orderId,
        razorpayOrderId: paymentResult.razorpay_order_id,
        razorpayPaymentId: paymentResult.razorpay_payment_id,
        razorpaySignature: paymentResult.razorpay_signature,
      });

      clearCart();
      toast.success("Payment verified and order confirmed.");
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (submitError) {
      setError(formatApiError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Checkout is waiting on cart items"
          message="Add products to the cart before placing an order."
          action={
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Continue shopping
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10 transition-colors duration-300">
      <div className="editorial-card bg-paper-glow p-6 sm:p-8 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
        <p className="eyebrow">Secure checkout</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-5xl font-semibold text-brand-dark sm:text-6xl">
              Complete your CandleOra order.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-brand-dark/70">
              Shipping, payment, and final review now live in a cleaner three-step checkout flow with COD and Razorpay sandbox support.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {steps.map((stepItem) => (
              <button
                key={stepItem.id}
                type="button"
                onClick={() => {
                  if (stepItem.id <= step || validateShippingStep()) {
                    setStep(stepItem.id);
                  }
                }}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                  stepItem.id === step
                    ? "bg-brand-dark text-white dark:bg-brand-primary"
                    : stepItem.id < step
                      ? "bg-brand-primary text-white"
                      : "bg-white/80 text-brand-dark dark:bg-[#241c17] dark:text-brand-dark"
                }`}
              >
                {stepItem.id}. {stepItem.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="panel space-y-6 p-6 sm:p-8 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
          {step === 1 && (
            <>
              <div>
                <p className="eyebrow">Step 1</p>
                <h2 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
                  Shipping details
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-dark">Full name</span>
                  <input
                    required
                    className={inputClassName}
                    name="shippingName"
                    value={form.shippingName}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-dark">
                    Email for e-invoice and order confirmation
                  </span>
                  <input
                    required
                    type="email"
                    className={inputClassName}
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Phone</span>
                  <input
                    required
                    className={inputClassName}
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Alternate phone</span>
                  <input
                    className={inputClassName}
                    name="alternatePhoneNumber"
                    value={form.alternatePhoneNumber}
                    onChange={handleChange}
                    autoComplete="tel-national"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-dark">Address line 1</span>
                  <input
                    required
                    className={inputClassName}
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    autoComplete="address-line1"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-dark">Address line 2</span>
                  <input
                    className={inputClassName}
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    autoComplete="address-line2"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">City</span>
                  <input
                    required
                    className={inputClassName}
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    autoComplete="address-level2"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">State</span>
                  <input
                    required
                    className={inputClassName}
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Postal code</span>
                  <input
                    required
                    className={inputClassName}
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    autoComplete="postal-code"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-dark">Location tag</span>
                  <input
                    className={inputClassName}
                    name="locationLabel"
                    value={form.locationLabel}
                    onChange={handleChange}
                    placeholder="Home, studio, security desk..."
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="rounded-full border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60 dark:border-[#6a5446] dark:bg-[#221915] dark:hover:border-brand-primary dark:hover:bg-[#2b201a]"
                  >
                    {isLocating ? "Detecting location..." : "Use current location"}
                  </button>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    className={inputClassName}
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    className={inputClassName}
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <p className="eyebrow">Step 2</p>
                <h2 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
                  Choose payment
                </h2>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    value: "RAZORPAY",
                    title: "Razorpay Online",
                    description: "Card, UPI, wallet, and netbanking via Razorpay sandbox.",
                  },
                  {
                    value: "COD",
                    title: "Cash on Delivery",
                    description: "Pay after the package reaches you.",
                  },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, paymentMethod: method.value }))
                    }
                    className={`rounded-[28px] border p-5 text-left transition ${
                      form.paymentMethod === method.value
                        ? "border-brand-primary bg-brand-secondary shadow-float dark:border-brand-primary/70 dark:bg-[#241a15]"
                        : "border-brand-primary/10 bg-white dark:border-[#5b473b] dark:bg-[#1a1411]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-brand-dark">{method.title}</p>
                        <p className="mt-2 text-sm leading-7 text-brand-dark/70">
                          {method.description}
                        </p>
                      </div>
                      <span
                        className={`mt-1 inline-flex h-5 w-5 rounded-full border ${
                          form.paymentMethod === method.value
                            ? "border-brand-primary bg-brand-primary"
                            : "border-brand-primary/30"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="eyebrow">Step 3</p>
                <h2 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
                  Review order
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[28px] bg-brand-secondary p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Shipping
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80">
                    <p>{form.shippingName}</p>
                    <p>{form.contactEmail}</p>
                    <p>{form.phone}</p>
                    <p>
                      {[form.addressLine1, form.addressLine2, form.city, form.state, form.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {form.locationLabel && <p>Tag: {form.locationLabel}</p>}
                  </div>
                </div>

                <div className="rounded-[28px] bg-brand-secondary p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Payment
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80">
                    <p className="font-semibold text-brand-dark">
                      {form.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay Online"}
                    </p>
                    <p>
                      {form.paymentMethod === "COD"
                        ? "Your order will be confirmed immediately and paid on delivery."
                        : "You will be redirected to the Razorpay checkout modal to finish the payment."}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="rounded-full border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary dark:border-[#6a5446] dark:bg-[#221915] dark:hover:border-brand-primary dark:hover:bg-[#2b201a]"
              >
                Back
              </button>
            )}

            {step < steps.length ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary dark:bg-brand-primary dark:text-[#120f0d] dark:hover:bg-[#d5a676]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60 dark:bg-brand-primary dark:text-[#120f0d] dark:hover:bg-[#d5a676]"
              >
                {isSubmitting
                  ? form.paymentMethod === "COD"
                    ? "Placing order..."
                    : "Preparing payment..."
                  : form.paymentMethod === "COD"
                    ? "Place order"
                    : "Pay with Razorpay"}
              </button>
            )}
          </div>
        </div>

        <aside className="panel h-fit space-y-5 p-6 dark:border-[#5b473b] dark:bg-[#120f0d] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
          <div>
            <p className="eyebrow">Summary</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-brand-dark">
              Your order
            </h2>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[20px] bg-brand-secondary p-4 dark:bg-[#1c1512] dark:ring-1 dark:ring-[#3f3129]"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                  <p className="text-xs text-brand-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-[24px] bg-[#fcf7f1] p-5 dark:bg-[linear-gradient(180deg,_rgba(39,28,22,0.96),_rgba(24,18,15,0.98))] dark:ring-1 dark:ring-[#4e3d32]">
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Subtotal</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Payment mode</span>
              <span>{form.paymentMethod === "COD" ? "COD" : "Razorpay"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-brand-primary/10 pt-3">
              <span className="text-sm font-semibold text-brand-dark">Grand total</span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
