import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CheckoutVerification from "../components/CheckoutVerification";
import { Link, useNavigate } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { couponApi, orderApi, paymentApi } from "../services/api";
import {
  buildCheckoutPayload,
  createCheckoutForm,
  mergeCheckoutFormWithUser,
} from "../utils/account";
import {
  canUseCashOnDelivery,
  COD_LIMIT,
  PHONE_AUTH_ENABLED,
  requiresEmailVerification,
  requiresPhoneVerification,
} from "../utils/authFlow";
import { formatApiError, formatCurrency } from "../utils/format";
import { getCurrentLocation } from "../utils/location";
import { PHONEPE_COMING_SOON_MESSAGE, PHONEPE_ENABLED } from "../utils/payments";
import {
  CHECKOUT_DRAFT_STORAGE_KEY,
  clearStoredJson,
  readStoredJson,
  writeStoredJson,
} from "../utils/storage";

const inputClassName =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-brand-dark outline-none transition focus:border-brand-primary/40 focus:bg-white";

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

const indianPhonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodePattern = /^\d{6}$/;
const SAMPLE_COUPON_CODE = String(import.meta.env.VITE_SAMPLE_COUPON_CODE ?? "").trim();
const SAMPLE_COUPON_HINT = String(import.meta.env.VITE_SAMPLE_COUPON_HINT ?? "").trim();

function Checkout() {
  const navigate = useNavigate();
  const { user, phoneAuth, refreshProfile, sendEmailVerification } = useAuth();
  const { items, grandTotal, clearCart } = useCart();
  const [form, setForm] = useState(() =>
    mergeCheckoutFormWithUser(readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, {}), user),
  );
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [emailVerificationPreviewUrl, setEmailVerificationPreviewUrl] = useState("");
  const [couponQuote, setCouponQuote] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const couponInputRef = useRef(null);

  useEffect(() => {
    setForm((current) => mergeCheckoutFormWithUser(current, user));
  }, [user]);

  useEffect(() => {
    writeStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, form);
  }, [form]);

  const phoneVerificationRequired = requiresPhoneVerification(user);
  const emailVerificationRecommended = requiresEmailVerification(user);
  const effectiveTotal = couponQuote?.totalAmount ?? grandTotal;
  const codEnabled = canUseCashOnDelivery(user, effectiveTotal);

  useEffect(() => {
    if (!codEnabled && form.paymentMethod === "COD") {
      setForm((current) => ({ ...current, paymentMethod: PHONEPE_ENABLED ? "PHONEPE" : "" }));
    }
  }, [codEnabled, form.paymentMethod]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );

  const cartSignature = useMemo(
    () => checkoutItems.map((item) => `${item.productId}:${item.quantity}`).join("|"),
    [checkoutItems],
  );

  useEffect(() => {
    if (couponQuote) {
      setCouponQuote(null);
      setCouponError("");
    }
  }, [cartSignature]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (name === "couponCode") {
      setCouponQuote(null);
      setCouponError("");
    }
  };

  const handleApplyCoupon = async () => {
    await applyCouponCode(form.couponCode);
  };

  const handleClearCoupon = () => {
    setForm((current) => ({ ...current, couponCode: "" }));
    setCouponQuote(null);
    setCouponError("");
  };

  const handleUseSampleCoupon = () => {
    if (!SAMPLE_COUPON_CODE) {
      return;
    }

    setForm((current) => ({ ...current, couponCode: SAMPLE_COUPON_CODE }));
    setCouponQuote(null);
    setCouponError("");
    couponInputRef.current?.focus();
    void applyCouponCode(SAMPLE_COUPON_CODE);
  };

  const applyCouponCode = async (rawCode) => {
    const code = String(rawCode ?? "").trim();
    if (!code) {
      setCouponError("Enter a coupon code to apply.");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const response = await couponApi.validate({
        code,
        items: checkoutItems,
      });
      setCouponQuote(response);
      setForm((current) => ({ ...current, couponCode: response.code }));
      toast.success("Coupon applied.");
    } catch (applyError) {
      setCouponError(formatApiError(applyError));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePhoneVerified = async ({ idToken, phoneNumber }) => {
    setError("");

    const response = await phoneAuth({
      idToken,
      name: user?.name ?? form.shippingName,
      email: user?.email ?? form.contactEmail,
      phoneNumber,
    });

    const refreshedUser = await refreshProfile().catch(() => response?.user ?? null);
    if (refreshedUser) {
      setForm((current) =>
        mergeCheckoutFormWithUser({ ...current, phone: phoneNumber || current.phone }, refreshedUser),
      );
    } else if (phoneNumber) {
      setForm((current) => ({ ...current, phone: phoneNumber }));
    }
  };

  const handleSendEmailVerification = async () => {
    setIsSendingEmailVerification(true);
    setEmailVerificationPreviewUrl("");

    try {
      const response = await sendEmailVerification();
      setEmailVerificationPreviewUrl(response?.previewUrl ?? "");
    } catch {
      // Errors are already surfaced through the shared auth context.
    } finally {
      setIsSendingEmailVerification(false);
    }
  };

  const validateShippingStep = () => {
    const missingField = requiredShippingFields.find((field) => !String(form[field] ?? "").trim());

    if (missingField) {
      setError("Complete the shipping address before continuing.");
      return false;
    }

    if (!emailPattern.test(String(form.contactEmail).trim())) {
      setError("Enter a valid email address for order confirmation.");
      return false;
    }

    const normalizedPhone = String(form.phone).replace(/\D/g, "");
    if (!indianPhonePattern.test(normalizedPhone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return false;
    }

    if (form.alternatePhoneNumber) {
      const normalizedAlternatePhone = String(form.alternatePhoneNumber).replace(/\D/g, "");
      if (!indianPhonePattern.test(normalizedAlternatePhone)) {
        setError("Enter a valid alternate 10-digit mobile number or leave it blank.");
        return false;
      }
    }

    if (!postalCodePattern.test(String(form.postalCode).trim())) {
      setError("Enter a valid 6-digit postal code.");
      return false;
    }

    return true;
  };

  const validatePaymentStep = () => {
    if (!form.paymentMethod) {
      setError(
        PHONEPE_ENABLED
          ? "Choose a payment method before continuing."
          : `No payment method is available for this order right now. ${PHONEPE_COMING_SOON_MESSAGE}`,
      );
      return false;
    }

    if (!PHONEPE_ENABLED && form.paymentMethod === "PHONEPE") {
      setError(PHONEPE_COMING_SOON_MESSAGE);
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
        locationLabel: location.locationLabel || current.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        addressLine1: location.addressLine1 || current.addressLine1,
        city: location.city || current.city,
        state: location.state || current.state,
        postalCode: location.postalCode || current.postalCode,
        country: location.country || current.country,
      }));
      toast.success(
        location.addressLine1 || location.city || location.state || location.country
          ? "Current location and address added."
          : "Current location attached.",
      );
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

    if (step === 2 && !validatePaymentStep()) {
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
      if (!PHONEPE_ENABLED && form.paymentMethod === "PHONEPE") {
        throw new Error(PHONEPE_COMING_SOON_MESSAGE);
      }

      if (!form.paymentMethod) {
        throw new Error("Select a payment method before placing the order.");
      }

      if (form.paymentMethod === "COD") {
        const order = await orderApi.createOrder(payload);
        clearStoredJson(CHECKOUT_DRAFT_STORAGE_KEY);
        clearCart();
        toast.success("Order placed successfully.");
        navigate(`/order-confirmation/${order.id}`, { replace: true });
        return;
      }

      const phonePePayment = await paymentApi.createPhonePeOrder(payload);
      toast.success("Redirecting to PhonePe...");
      window.location.assign(phonePePayment.checkoutUrl);
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
              className="btn btn-primary mt-6"
            >
              Continue shopping
            </Link>
          }
        />
      </section>
    );
  }

  const orderSummary = (
    <aside className="panel h-fit space-y-5 p-6">
      <div>
        <p className="eyebrow">Summary</p>
        <h2 className="panel-title mt-3">
          Your order
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-4"
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

        <div className="space-y-3 rounded-[24px] bg-white p-5">
        <div className="flex items-center justify-between text-sm text-brand-dark/70">
          <span>Subtotal</span>
          <span>{formatCurrency(couponQuote?.subtotalAmount ?? grandTotal)}</span>
        </div>
        {couponQuote?.discountAmount ? (
          <div className="flex items-center justify-between text-sm text-brand-dark/70">
            <span>Discount</span>
            <span>-{formatCurrency(couponQuote.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm text-brand-dark/70">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="flex items-center justify-between text-sm text-brand-dark/70">
          <span>Payment mode</span>
          <span>
            {form.paymentMethod === "COD"
              ? "COD"
              : form.paymentMethod === "PHONEPE"
                ? "PhonePe"
                : "Not available"}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-brand-primary/10 pt-3">
          <span className="text-sm font-semibold text-brand-dark">Grand total</span>
          <span className="text-2xl font-extrabold text-brand-dark">
            {formatCurrency(effectiveTotal)}
          </span>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
          Coupon
        </p>
        {SAMPLE_COUPON_CODE && (
          <div className="mt-3 rounded-[18px] bg-brand-primary/10 px-4 py-3 text-xs text-brand-dark/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold text-brand-dark">Sample code:</span>{" "}
                <span className="font-semibold text-brand-dark">{SAMPLE_COUPON_CODE}</span>
                {SAMPLE_COUPON_HINT ? ` — ${SAMPLE_COUPON_HINT}` : ""}
              </div>
              <button
                type="button"
                className="btn btn-outline whitespace-nowrap"
                onClick={handleUseSampleCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? "Applying..." : "Use coupon"}
              </button>
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-col gap-3">
          <input
            ref={couponInputRef}
            className={inputClassName}
            name="couponCode"
            value={form.couponCode}
            onChange={handleChange}
            placeholder="Enter code"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
            >
              {isApplyingCoupon ? "Applying..." : "Apply coupon"}
            </button>
            {couponQuote && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClearCoupon}
              >
                Remove
              </button>
            )}
          </div>
          {couponQuote?.message && (
            <p className="text-sm text-success">{couponQuote.message}</p>
          )}
          {couponError && (
            <p className="text-sm text-danger">{couponError}</p>
          )}
        </div>
      </div>
    </aside>
  );

  if (PHONE_AUTH_ENABLED && phoneVerificationRequired) {
    return (
      <section className="container-shell space-y-8 py-10 transition-colors duration-300">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <CheckoutVerification
            user={user}
            defaultPhoneNumber={form.phone || user?.phoneNumber || ""}
            isSendingEmailVerification={isSendingEmailVerification}
            emailVerificationPreviewUrl={emailVerificationPreviewUrl}
            onPhoneVerified={handlePhoneVerified}
            onSendEmailVerification={handleSendEmailVerification}
          />
          {orderSummary}
        </div>
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10 transition-colors duration-300">
      <div className="editorial-card p-6 sm:p-8">
        <p className="eyebrow">Secure checkout</p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">
              Complete your CandleOra order.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-brand-dark/70">
              Shipping, payment, and final review now live in a cleaner three-step checkout flow with COD and PhonePe hosted checkout support.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {steps.map((stepItem) => (
              <button
                key={stepItem.id}
                type="button"
                onClick={() => {
                  const canAdvance =
                    stepItem.id <= step ||
                    (step === 1 ? validateShippingStep() : step === 2 ? validatePaymentStep() : true);

                  if (canAdvance) {
                    setStep(stepItem.id);
                  }
                }}
                className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                  stepItem.id === step
                    ? "bg-brand-dark text-white"
                    : stepItem.id < step
                      ? "bg-brand-primary text-white"
                      : "bg-white text-brand-dark"
                }`}
              >
                {stepItem.id}. {stepItem.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="panel space-y-6 p-6 sm:p-8">
          {emailVerificationRecommended && (
            <div className="rounded-[24px] border border-brand-primary/20 bg-brand-primary/10 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-black">Verify your email</p>
                  <p className="mt-1 text-sm leading-7 text-black/70">
                    This is optional for checkout, but recommended for password recovery and order updates.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendEmailVerification}
                    disabled={isSendingEmailVerification}
                    className="btn btn-outline disabled:opacity-60"
                  >
                    {isSendingEmailVerification ? "Preparing link..." : "Send verification link"}
                  </button>

                  {emailVerificationPreviewUrl && (
                    <a
                      href={emailVerificationPreviewUrl}
                      className="text-sm font-semibold text-black underline underline-offset-4"
                    >
                      Open preview link
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <p className="eyebrow">Step 1</p>
                <h2 className="panel-title mt-3">
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
                    inputMode="tel"
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
                    inputMode="tel"
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
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-brand-dark">Country</span>
                  <input
                    className={inputClassName}
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    autoComplete="country-name"
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
                    className="btn btn-outline disabled:opacity-60"
                  >
                    {isLocating ? "Detecting location..." : "Use current location"}
                  </button>
                  <p className="mt-2 text-xs leading-6 text-brand-dark/55">
                    Address lookup helper powered by OpenStreetMap.
                  </p>
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
                <h2 className="panel-title mt-3">
                  Choose payment
                </h2>
              </div>

          <div className="grid gap-4">
                {[
                  {
                    value: "PHONEPE",
                    title: "PhonePe Online",
                    description: PHONEPE_ENABLED
                      ? "UPI, cards, netbanking, and wallets through PhonePe hosted checkout."
                      : PHONEPE_COMING_SOON_MESSAGE,
                    disabled: !PHONEPE_ENABLED,
                  },
                  {
                    value: "COD",
                    title: "Cash on Delivery",
                    description: codEnabled
                      ? "Pay after the package reaches you."
                      : `Available only for totals up to ${formatCurrency(COD_LIMIT)}.`,
                    disabled: !codEnabled,
                  },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, paymentMethod: method.value }))
                    }
                    disabled={method.disabled}
                    className={`rounded-[28px] border p-5 text-left transition ${
                      form.paymentMethod === method.value
                        ? "border-brand-primary bg-white shadow-float"
                        : "border-brand-primary/10 bg-white"
                    } ${method.disabled ? "cursor-not-allowed opacity-60" : ""}`}
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
                <h2 className="panel-title mt-3">
                  Review order
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[28px] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Shipping
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80">
                    <p>{form.shippingName}</p>
                    <p>{form.contactEmail}</p>
                    <p>{form.phone}</p>
                    <p>
                      {[
                        form.addressLine1,
                        form.addressLine2,
                        form.city,
                        form.state,
                        form.postalCode,
                        form.country,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {form.locationLabel && <p>Tag: {form.locationLabel}</p>}
                  </div>
                </div>

                <div className="rounded-[28px] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Payment
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80">
                    <p className="font-semibold text-brand-dark">
                      {form.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : form.paymentMethod === "PHONEPE"
                          ? "PhonePe Online"
                          : "Payment method unavailable"}
                    </p>
                    <p>
                      {form.paymentMethod === "COD"
                        ? "Your order will be confirmed immediately and paid on delivery."
                        : form.paymentMethod === "PHONEPE"
                          ? "You will be redirected to PhonePe to finish the payment securely."
                          : PHONEPE_COMING_SOON_MESSAGE}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          {!PHONEPE_ENABLED && (
            <p className="text-sm text-brand-dark/65">
              {PHONEPE_COMING_SOON_MESSAGE}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="btn btn-outline"
              >
                Back
              </button>
            )}

            {step < steps.length ? (
              <button
                type="button"
                onClick={goToNextStep}
                className="btn btn-secondary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className="btn btn-secondary disabled:opacity-60"
              >
                {isSubmitting
                  ? form.paymentMethod === "COD"
                    ? "Placing order..."
                    : "Redirecting to PhonePe..."
                  : form.paymentMethod === "COD"
                    ? "Place order"
                    : "Pay with PhonePe"}
              </button>
            )}
          </div>
        </div>

        {orderSummary}
      </div>
    </section>
  );
}

export default Checkout;
