import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import CheckoutVerification from "../components/CheckoutVerification";
import StatusView from "../components/StatusView";
import { useAddresses } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { couponApi, orderApi, paymentApi } from "../services/api";
import { buildCheckoutPayload, mergeCheckoutFormWithUser } from "../utils/account";
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
  "w-full rounded-[12px] border border-black/12 bg-white px-4 py-3 text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/40 focus:bg-white";

const requiredShippingFields = [
  "shippingName",
  "contactEmail",
  "phone",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
];

const indianPhonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodePattern = /^\d{6}$/;
const SAMPLE_COUPON_CODE = String(import.meta.env.VITE_SAMPLE_COUPON_CODE ?? "").trim();
const SAMPLE_COUPON_HINT = String(import.meta.env.VITE_SAMPLE_COUPON_HINT ?? "").trim();

function normalizeBillingValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function buildBillingAddressKey(source = {}) {
  return [
    source.shippingName ?? source.recipientName,
    source.addressLine1,
    source.addressLine2,
    source.city,
    source.state,
    source.postalCode,
    source.country,
    source.phone ?? source.phoneNumber,
  ]
    .map(normalizeBillingValue)
    .join("|");
}

function hasBillingSummaryDetails(source = {}) {
  const phone = String(source.phone ?? "").replace(/\D/g, "");
  const alternatePhone = String(source.alternatePhoneNumber ?? "").replace(/\D/g, "");

  if (
    !String(source.shippingName ?? "").trim() ||
    !String(source.contactEmail ?? "").trim() ||
    !String(source.addressLine1 ?? "").trim() ||
    !String(source.city ?? "").trim() ||
    !String(source.state ?? "").trim() ||
    !String(source.postalCode ?? "").trim() ||
    !String(source.country ?? "").trim()
  ) {
    return false;
  }

  if (!emailPattern.test(String(source.contactEmail).trim())) {
    return false;
  }

  if (!indianPhonePattern.test(phone)) {
    return false;
  }

  if (alternatePhone && !indianPhonePattern.test(alternatePhone)) {
    return false;
  }

  return postalCodePattern.test(String(source.postalCode).trim());
}

function formatBillingAddress(source = {}) {
  return [
    source.addressLine1,
    source.addressLine2,
    source.city,
    source.state,
    source.postalCode,
    source.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function ChevronToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { user, isAuthenticated, phoneAuth, refreshProfile, sendEmailVerification } = useAuth();
  const {
    addresses: savedAddresses,
    isLoading: isAddressesLoading,
    createAddress,
  } = useAddresses();
  const { items, grandTotal, clearCart } = useCart();
  const [form, setForm] = useState(() =>
    mergeCheckoutFormWithUser(readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, {}), user),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSendingEmailVerification, setIsSendingEmailVerification] = useState(false);
  const [emailVerificationPreviewUrl, setEmailVerificationPreviewUrl] = useState("");
  const [couponQuote, setCouponQuote] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [isSavedAddressesExpanded, setIsSavedAddressesExpanded] = useState(true);
  const [hasPrimedSavedAddressesView, setHasPrimedSavedAddressesView] = useState(false);
  const [isBillingExpanded, setIsBillingExpanded] = useState(true);
  const [hasPrimedBillingView, setHasPrimedBillingView] = useState(false);
  const [isCurrentLocationAssistExpanded, setIsCurrentLocationAssistExpanded] = useState(false);
  const [currentLocationPreview, setCurrentLocationPreview] = useState(null);
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
  const normalizedCouponInput = String(form.couponCode ?? "").trim().toUpperCase();
  const appliedCouponCode = String(couponQuote?.code ?? "").trim().toUpperCase();
  const isCouponApplied = Boolean(
    couponQuote && appliedCouponCode && appliedCouponCode === normalizedCouponInput,
  );
  const billingSummaryReady = useMemo(() => hasBillingSummaryDetails(form), [form]);
  const currentBillingKey = useMemo(() => buildBillingAddressKey(form), [form]);
  const selectedSavedAddress = useMemo(
    () => savedAddresses.find((address) => buildBillingAddressKey(address) === currentBillingKey) ?? null,
    [currentBillingKey, savedAddresses],
  );
  const hasMatchingSavedAddress = Boolean(selectedSavedAddress);
  const checkoutAddressTag = String(form.addressLabel ?? "").trim() || selectedSavedAddress?.label || "";
  const currentLocationTag = String(form.locationLabel ?? "").trim();
  const currentLocationPostOffice = String(currentLocationPreview?.nearestPostOffice ?? "").trim();
  const currentLocationPostalCode = String(
    currentLocationPreview?.postalCode ?? form.postalCode ?? "",
  ).trim();
  const currentLocationReference = String(
    currentLocationPreview?.nearestPostalReference ?? currentLocationPreview?.displayAddress ?? "",
  ).trim();
  const hasCurrentLocationCoordinates = Boolean(
    String(form.latitude ?? "").trim() && String(form.longitude ?? "").trim(),
  );
  const hasCurrentLocationAssist = Boolean(
    currentLocationTag || currentLocationReference || hasCurrentLocationCoordinates,
  );

  useEffect(() => {
    if (couponQuote) {
      setCouponQuote(null);
      setCouponError("");
    }
  }, [cartSignature]);

  useEffect(() => {
    if (hasPrimedBillingView || isAddressesLoading) {
      return;
    }

    if (billingSummaryReady) {
      setIsBillingExpanded(false);
    }

    setHasPrimedBillingView(true);
  }, [billingSummaryReady, hasPrimedBillingView, isAddressesLoading]);

  useEffect(() => {
    if (hasPrimedSavedAddressesView || isAddressesLoading) {
      return;
    }

    if (savedAddresses.length && (hasMatchingSavedAddress || billingSummaryReady)) {
      setIsSavedAddressesExpanded(false);
    }

    setHasPrimedSavedAddressesView(true);
  }, [
    billingSummaryReady,
    hasMatchingSavedAddress,
    hasPrimedSavedAddressesView,
    isAddressesLoading,
    savedAddresses.length,
  ]);

  useEffect(() => {
    if (hasMatchingSavedAddress) {
      setSaveAddressForFuture(false);
    }
  }, [hasMatchingSavedAddress]);

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
      setIsBillingExpanded(true);
      setError("Complete the billing details before placing the order.");
      return false;
    }

    if (!emailPattern.test(String(form.contactEmail).trim())) {
      setIsBillingExpanded(true);
      setError("Enter a valid email address for order confirmation.");
      return false;
    }

    const normalizedPhone = String(form.phone).replace(/\D/g, "");
    if (!indianPhonePattern.test(normalizedPhone)) {
      setIsBillingExpanded(true);
      setError("Enter a valid 10-digit Indian mobile number.");
      return false;
    }

    if (form.alternatePhoneNumber) {
      const normalizedAlternatePhone = String(form.alternatePhoneNumber).replace(/\D/g, "");
      if (!indianPhonePattern.test(normalizedAlternatePhone)) {
        setIsBillingExpanded(true);
        setError("Enter a valid alternate 10-digit mobile number or leave it blank.");
        return false;
      }
    }

    if (!postalCodePattern.test(String(form.postalCode).trim())) {
      setIsBillingExpanded(true);
      setError("Enter a valid 6-digit postal code.");
      return false;
    }

    return true;
  };

  const validatePaymentStep = () => {
    if (!form.paymentMethod) {
      setError(
        PHONEPE_ENABLED
          ? "Choose a payment method before placing the order."
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
      setCurrentLocationPreview(location);
      setIsCurrentLocationAssistExpanded(true);
      setForm((current) => ({
        ...current,
        addressLine1: current.addressLine1 || location.addressLine1 || current.addressLine1,
        addressLine2:
          current.addressLine2 || location.nearestPostalReference || location.addressLine2 || current.addressLine2,
        city: current.city || location.city || current.city,
        state: current.state || location.state || current.state,
        postalCode: current.postalCode || location.postalCode || current.postalCode,
        country: current.country || location.country || current.country,
        locationLabel: location.locationLabel || current.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }));
      toast.success(
        location.nearestPostalReference
          ? `Current location captured around ${location.nearestPostalReference}.`
          : "Current location captured for delivery reference.",
      );
    } catch (locationError) {
      setError(formatApiError(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const handleUseSavedAddress = (address) => {
    setForm((current) => ({
      ...current,
      shippingName: address.recipientName || current.shippingName,
      phone: address.phoneNumber || current.phone,
      addressLine1: address.addressLine1 || current.addressLine1,
      addressLine2: address.addressLine2 || current.addressLine2,
      city: address.city || current.city,
      state: address.state || current.state,
      postalCode: address.postalCode || current.postalCode,
      country: address.country || current.country,
      addressLabel: address.label || current.addressLabel,
    }));
    setSaveAddressForFuture(false);
    setIsSavedAddressesExpanded(false);
    setIsBillingExpanded(false);
    setIsCurrentLocationAssistExpanded(false);
    toast.success("Saved address applied.");
  };

  const persistCheckoutAddressIfNeeded = async () => {
    if (!isAuthenticated || !saveAddressForFuture || hasMatchingSavedAddress) {
      return false;
    }

    try {
      await createAddress({
        label: form.addressLabel || selectedSavedAddress?.label || form.locationLabel || "Saved Address",
        recipientName: form.shippingName,
        phoneNumber: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country || "India",
        isDefault: savedAddresses.length === 0,
      });
      return true;
    } catch {
      toast.error("Order will continue, but we could not save this address to your account.");
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (!validateShippingStep() || !validatePaymentStep()) {
      return;
    }

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
        await persistCheckoutAddressIfNeeded();
        clearStoredJson(CHECKOUT_DRAFT_STORAGE_KEY);
        clearCart();
        toast.success("Order placed successfully.");
        navigate(`/order-confirmation/${order.id}`, { replace: true });
        return;
      }

      const phonePePayment = await paymentApi.createPhonePeOrder(payload);
      await persistCheckoutAddressIfNeeded();
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
            <Link to="/shop" className="btn btn-primary mt-6">
              Continue shopping
            </Link>
          }
        />
      </section>
    );
  }

  const paymentMethods = [
    {
      value: "COD",
      title: "Cash on Delivery",
      description: codEnabled
        ? "Your order will be confirmed immediately and paid on delivery."
        : `Available only for totals up to ${formatCurrency(COD_LIMIT)}.`,
      disabled: !codEnabled,
    },
    {
      value: "PHONEPE",
      title: "PhonePe Online",
      description: PHONEPE_ENABLED
        ? "UPI, cards, netbanking, and wallets through PhonePe hosted checkout."
        : PHONEPE_COMING_SOON_MESSAGE,
      disabled: !PHONEPE_ENABLED,
    },
  ];

  const paymentCard = (
    <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
      <div className="bg-black px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white">
        Payment
      </div>

      <div className="grid gap-4 px-5 py-5">
        {paymentMethods.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => setForm((current) => ({ ...current, paymentMethod: method.value }))}
            disabled={method.disabled}
            className={`rounded-[14px] border px-4 py-4 text-left transition ${
              form.paymentMethod === method.value
                ? "border-brand-primary bg-brand-primary/10"
                : "border-black/10 bg-white"
            } ${method.disabled ? "cursor-not-allowed opacity-55" : "hover:border-black/20"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-black">{method.title}</p>
                <p className="mt-1 text-sm leading-6 text-black/60">{method.description}</p>
              </div>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 rounded-full border ${
                  form.paymentMethod === method.value
                    ? "border-brand-primary bg-brand-primary"
                    : "border-black/20"
                }`}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const shouldScrollSavedAddresses = savedAddresses.length > 3;
  const showSidebarPlaceOrder = phoneVerificationRequired || !billingSummaryReady;
  const placeOrderButton = (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={handlePlaceOrder}
      className="btn btn-success h-[52px] w-full rounded-[10px] px-6 text-base disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSubmitting
        ? form.paymentMethod === "COD"
          ? "Placing order..."
          : "Redirecting to PhonePe..."
        : form.paymentMethod === "PHONEPE"
          ? "Pay Now"
          : "Place Order"}
    </button>
  );

  const orderSummary = (
    <aside className="space-y-5">
      <div className="flex items-start gap-3">
          <input
            id="couponCode"
            ref={couponInputRef}
            className={`${inputClassName} h-[48px] flex-1`}
            name="couponCode"
            value={form.couponCode}
            onChange={handleChange}
            placeholder="Discount Code"
            disabled={isApplyingCoupon || isCouponApplied}
          />
          <button
            type="button"
            className={`h-[48px] shrink-0 rounded-full px-6 ${
              isCouponApplied ? "btn btn-outline" : "btn btn-secondary"
            }`}
            onClick={isCouponApplied ? handleClearCoupon : handleApplyCoupon}
            disabled={isApplyingCoupon}
          >
            {isApplyingCoupon ? "Applying..." : isCouponApplied ? "Remove coupon" : "Apply"}
          </button>
      </div>

      {SAMPLE_COUPON_CODE && (
        <div className="rounded-[16px] border border-brand-primary/20 bg-brand-primary/10 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                Launch coupon
              </p>
              <p className="mt-1 text-sm font-semibold text-black">{SAMPLE_COUPON_CODE}</p>
              {SAMPLE_COUPON_HINT && (
                <p className="mt-1 text-sm leading-6 text-black/65">{SAMPLE_COUPON_HINT}</p>
              )}
            </div>
            <button
              type="button"
              className={`shrink-0 whitespace-nowrap rounded-full ${
                appliedCouponCode === SAMPLE_COUPON_CODE
                  ? "inline-flex h-[40px] items-center justify-center border border-black/14 bg-white px-4 text-sm font-semibold text-black/80"
                  : "btn btn-outline"
              }`}
              onClick={handleUseSampleCoupon}
              disabled={isApplyingCoupon || appliedCouponCode === SAMPLE_COUPON_CODE}
            >
              {isApplyingCoupon
                ? "Applying..."
                : appliedCouponCode === SAMPLE_COUPON_CODE
                  ? "Coupon applied"
                  : "Use coupon"}
            </button>
          </div>
        </div>
      )}

      {(couponQuote?.message || couponError || couponQuote) && (
        <div className="rounded-[16px] border border-black/10 bg-white px-4 py-4">
          <div className="min-h-[22px]">
            {couponQuote?.message && (
              <p className="text-sm font-medium text-success">{couponQuote.message}</p>
            )}
            {couponError && <p className="text-sm font-medium text-danger">{couponError}</p>}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
        <div className="bg-black px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white">
          Cart Details
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-[minmax(0,1fr)_62px_88px] gap-3 border-b border-black/8 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
            <span>Product</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Subtotal</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_62px_88px] gap-3 text-sm text-black/72"
              >
                <span className="truncate pr-2">{item.productName}</span>
                <span className="text-center">{String(item.quantity).padStart(2, "0")}</span>
                <span className="text-right font-medium text-black">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-dashed border-black/10 pt-4 text-sm text-black/66">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(couponQuote?.subtotalAmount ?? grandTotal)}</span>
            </div>
            {couponQuote?.discountAmount ? (
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>-{formatCurrency(couponQuote.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-base font-semibold text-black">
              <span>Total</span>
              <span>{formatCurrency(effectiveTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {paymentCard}

      {error ? (
        <div className="rounded-[16px] border border-danger/18 bg-danger/6 px-4 py-3.5">
          <p className="text-sm font-semibold leading-6 text-red-600">{error}</p>
        </div>
      ) : null}

      {showSidebarPlaceOrder ? placeOrderButton : null}
    </aside>
  );

  if (PHONE_AUTH_ENABLED && phoneVerificationRequired) {
    return (
      <section className="container-shell space-y-8 py-10 transition-colors duration-300">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_450px]">
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
      <div className="space-y-3">
        <h1 className="page-title">Checkout</h1>
        <p className="max-w-[860px] text-body leading-7 text-black/58">
          Match your delivery details, apply a coupon if you have one, and review the cart before placing the order.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_450px]">
        <div className="space-y-6">
          {emailVerificationRecommended && (
            <div className="rounded-[16px] border border-brand-primary/20 bg-brand-primary/10 p-5">
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

          {isAddressesLoading ? (
            <div className="rounded-[16px] border border-black/10 bg-white p-5 text-sm text-black/58 shadow-sm">
              Loading saved addresses...
            </div>
          ) : savedAddresses.length ? (
            <div className="overflow-hidden rounded-[16px] border border-black/10 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-black">Use a saved billing profile</p>
                  <p className="text-sm leading-6 text-black/62">
                    Switch to one of your saved delivery details and keep checkout summary-first.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center md:shrink-0">
                  <Link
                    to="/profile/details#addresses"
                    className="inline-flex items-center whitespace-nowrap text-sm font-semibold leading-none text-black underline underline-offset-4"
                  >
                    Manage addresses
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsSavedAddressesExpanded((current) => !current)}
                    aria-expanded={isSavedAddressesExpanded}
                    aria-controls="checkout-saved-addresses"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-black/10 text-black transition hover:border-black/25 hover:bg-black/5"
                  >
                    <m.span
                      animate={{ rotate: isSavedAddressesExpanded ? 180 : 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 175, damping: 18, mass: 1.05 }
                      }
                      className="inline-flex"
                    >
                      <ChevronToggleIcon />
                    </m.span>
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isSavedAddressesExpanded ? (
                  <m.div
                    key="checkout-saved-addresses"
                    id="checkout-saved-addresses"
                    initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.12 }
                        : {
                            height: {
                              type: "spring",
                              stiffness: 155,
                              damping: 22,
                              mass: 1.02,
                            },
                            opacity: {
                              duration: 0.22,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          }
                    }
                    className="overflow-hidden border-t border-black/8"
                  >
                    <m.div
                      initial={prefersReducedMotion ? false : { y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { y: -2, opacity: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              y: {
                                type: "spring",
                                stiffness: 140,
                                damping: 20,
                                mass: 0.9,
                              },
                              opacity: {
                                duration: 0.22,
                                delay: 0.04,
                                ease: [0.22, 1, 0.36, 1],
                              },
                            }
                      }
                      className={`grid gap-3 px-5 py-4 ${
                        shouldScrollSavedAddresses
                          ? "mini-cart-scroll-view stealth-scrollbar max-h-[372px] overflow-y-auto pr-2"
                          : ""
                      }`}
                    >
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => handleUseSavedAddress(address)}
                          className="rounded-[14px] border border-black/10 bg-white px-4 py-4 text-left transition hover:border-black/25 hover:shadow-[0_8px_18px_rgba(0,0,0,0.05)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                                {address.label || "Saved Address"}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-black">
                                {address.recipientName}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-black/60">
                                {[
                                  address.addressLine1,
                                  address.addressLine2,
                                  address.city,
                                  address.state,
                                  address.postalCode,
                                  address.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                            <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-black">
                              Use
                            </span>
                          </div>
                        </button>
                      ))}
                    </m.div>
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
            <div className="flex flex-col gap-4 bg-black px-6 py-5 text-white lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">Billing Summary</p>
                <p className="max-w-[660px] text-sm leading-6 text-white/72 normal-case tracking-normal">
                  {billingSummaryReady
                    ? "Checkout is using the delivery details already available in your account, so you only need to review them here."
                    : "Complete these delivery details once in your profile, and checkout can stay compact with a ready-to-review summary."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
                <Link
                  to={billingSummaryReady ? "/profile/details#addresses" : "/profile/details"}
                  className="inline-flex min-h-[42px] items-center justify-center whitespace-nowrap rounded-full border border-white/16 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {billingSummaryReady ? "Manage in profile" : "Complete profile"}
                </Link>
              </div>
            </div>

            {billingSummaryReady ? (
              <div className="space-y-5 px-6 py-6 sm:px-7">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Recipient
                    </p>
                    <p className="mt-2 text-base font-semibold text-black">{form.shippingName}</p>
                  </div>

                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Contact
                    </p>
                    <p className="mt-2 text-sm font-semibold text-black">{form.contactEmail}</p>
                    <p className="mt-1 text-sm text-black/62">
                      {[form.phone, form.alternatePhoneNumber].filter(Boolean).join(" | ")}
                    </p>
                  </div>

                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4 md:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Delivery Address
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/72">{formatBillingAddress(form)}</p>
                  </div>

                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Address Tag
                    </p>
                    <p className="mt-2 text-sm font-semibold text-black">
                      {checkoutAddressTag || "Primary address"}
                    </p>
                  </div>

                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Current Location Tag
                    </p>
                    <p className="mt-2 text-sm font-semibold text-black">
                      {currentLocationTag || "Optional live delivery reference not added yet"}
                    </p>
                  </div>

                  <div className="h-full rounded-[16px] border border-black/8 bg-[#fffdfa] p-4 md:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                      Billing Status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-black">
                      {selectedSavedAddress
                        ? "Backed by a saved account address"
                        : "Using your current account details"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-black/8 pt-4">
                  <p className="max-w-[620px] text-sm leading-6 text-black/58">
                    {selectedSavedAddress
                      ? "This summary is already linked to one of your saved addresses. Open the editor only if you want to make a one-off change."
                      : "These details are ready for checkout. If you want this exact version saved as an address card too, you can still do that from the editor below."}
                  </p>
                  <div className="overflow-hidden rounded-[16px] border border-black/8 bg-[#fffdfa]">
                    <button
                      type="button"
                      onClick={() => setIsCurrentLocationAssistExpanded((current) => !current)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                      aria-expanded={isCurrentLocationAssistExpanded}
                      aria-controls="checkout-current-location-assist"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-black">Current location assist</p>
                        <p className="text-xs leading-5 text-black/58">
                          Optional when you are physically at the delivery spot and want to share a sharper live delivery reference.
                        </p>
                      </div>
                      <m.span
                        animate={{ rotate: isCurrentLocationAssistExpanded ? 180 : 0 }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 175, damping: 18, mass: 1.05 }
                        }
                        className="inline-flex text-black"
                      >
                        <ChevronToggleIcon />
                      </m.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isCurrentLocationAssistExpanded ? (
                        <m.div
                          key="checkout-current-location-assist"
                          id="checkout-current-location-assist"
                          initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0.12 }
                              : {
                                  height: {
                                    type: "spring",
                                    stiffness: 155,
                                    damping: 22,
                                    mass: 1.02,
                                  },
                                  opacity: {
                                    duration: 0.24,
                                    ease: [0.22, 1, 0.36, 1],
                                  },
                                }
                          }
                          className="overflow-hidden border-t border-black/8"
                        >
                          <m.div
                            initial={prefersReducedMotion ? false : { y: -4, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { y: -2, opacity: 0 }}
                            transition={
                              prefersReducedMotion
                                ? { duration: 0 }
                                : {
                                    y: {
                                      type: "spring",
                                      stiffness: 140,
                                      damping: 20,
                                      mass: 0.9,
                                    },
                                    opacity: {
                                      duration: 0.22,
                                      delay: 0.04,
                                      ease: [0.22, 1, 0.36, 1],
                                    },
                                  }
                            }
                            className="space-y-4 px-4 py-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="max-w-[520px] text-sm leading-6 text-black/60">
                                Use this only if you are currently at the delivery location. We will capture the live coordinates and a nearby postal reference when available.
                              </p>
                              <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                disabled={isLocating}
                                className="btn btn-outline h-[44px] min-w-[196px] shrink-0 whitespace-nowrap rounded-full px-5 text-sm disabled:opacity-60"
                              >
                                {isLocating ? "Fetching..." : "Fetch current location"}
                              </button>
                            </div>

                            {hasCurrentLocationAssist ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-[14px] border border-black/8 bg-white p-3.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                                    Current Location Tag
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-black">
                                    {currentLocationTag || "Captured once location is fetched"}
                                  </p>
                                </div>

                                <div className="rounded-[14px] border border-black/8 bg-white p-3.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                                    Nearest Postal Reference
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-black">
                                    {currentLocationReference || "We will add the best nearby postal reference when available."}
                                  </p>
                                </div>

                                <div className="rounded-[14px] border border-black/8 bg-white p-3.5 md:col-span-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                                    Nearest Post Office
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-black">
                                    {currentLocationPostOffice || "We will show the closest postal area once it can be resolved."}
                                  </p>
                                </div>

                                <div className="rounded-[14px] border border-black/8 bg-white p-3.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                                    Live Coordinates
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-black">
                                    {hasCurrentLocationCoordinates
                                      ? `${form.latitude}, ${form.longitude}`
                                      : "Coordinates will appear here after location access is granted."}
                                  </p>
                                </div>

                                <div className="rounded-[14px] border border-black/8 bg-white p-3.5">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                                    Postal Code
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-black">
                                    {currentLocationPostalCode || "Postal code will appear here after lookup."}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-[14px] border border-dashed border-black/10 bg-white px-4 py-3 text-sm leading-6 text-black/58">
                                No live delivery reference has been added yet. You can skip this step unless you are already at the exact delivery spot.
                              </div>
                            )}
                          </m.div>
                        </m.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsBillingExpanded(true)}
                      className="btn btn-outline min-h-[48px] min-w-[220px] shrink-0 whitespace-nowrap rounded-full px-6 text-sm leading-none"
                    >
                      Update billing details
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePlaceOrder}
                      className="btn btn-success min-h-[48px] min-w-[220px] shrink-0 rounded-full px-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting
                        ? form.paymentMethod === "COD"
                          ? "Placing order..."
                          : "Redirecting to PhonePe..."
                        : form.paymentMethod === "PHONEPE"
                          ? "Pay Now"
                          : "Place Order"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="max-w-[620px]">
                  <p className="text-base font-semibold text-black">Complete your saved billing details first</p>
                  <p className="mt-1 text-sm leading-6 text-black/62">
                    Add your primary delivery details in Account Details or save an address in your profile. After that, checkout can stay focused on review instead of data entry.
                  </p>
                </div>
                <Link to="/profile/details" className="btn btn-secondary min-h-[46px] rounded-full px-5 text-sm">
                  Complete profile
                </Link>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
            <button
              type="button"
              onClick={() => setIsBillingExpanded((current) => !current)}
              className="flex w-full items-center justify-between bg-black px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.14em] text-white"
              aria-expanded={isBillingExpanded}
              aria-controls="checkout-billing-details"
            >
              <span>{billingSummaryReady ? "Update Billing Details" : "Billing Details"}</span>
              <m.span
                animate={{ rotate: isBillingExpanded ? 180 : 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 175, damping: 18, mass: 1.05 }
                }
                className="inline-flex"
              >
                <ChevronToggleIcon />
              </m.span>
            </button>

            <AnimatePresence initial={false}>
              {isBillingExpanded ? (
                <m.div
                  key="checkout-billing-details"
                  id="checkout-billing-details"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { height: "auto", opacity: 1 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { height: 0, opacity: 0 }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.12 }
                      : {
                          height: {
                            type: "spring",
                            stiffness: 155,
                            damping: 22,
                            mass: 1.02,
                          },
                          opacity: {
                            duration: 0.24,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        }
                  }
                  className="overflow-hidden"
                >
                  <m.div
                    className="overflow-hidden"
                  >
                    <m.div
                      initial={prefersReducedMotion ? false : { y: -4, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { y: -2, opacity: 0 }
                      }
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              y: {
                                type: "spring",
                                stiffness: 140,
                                damping: 20,
                                mass: 0.9,
                              },
                              opacity: {
                                duration: 0.22,
                                delay: 0.04,
                                ease: [0.22, 1, 0.36, 1],
                              },
                            }
                      }
                      className="space-y-6 px-6 py-6 sm:px-7"
                    >
                    <div className="grid gap-4 md:grid-cols-2 lg:gap-x-5 lg:gap-y-4">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-black/74">Full Name*</span>
                        <input
                          required
                          className={inputClassName}
                          name="shippingName"
                          value={form.shippingName}
                          onChange={handleChange}
                          autoComplete="name"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-black/74">Email Address*</span>
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
                        <span className="text-sm font-medium text-black/74">Street Address*</span>
                        <input
                          required
                          className={inputClassName}
                          name="addressLine1"
                          value={form.addressLine1}
                          onChange={handleChange}
                          autoComplete="address-line1"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-black/74">Nearest location / landmark</span>
                        <input
                          className={inputClassName}
                          name="addressLine2"
                          value={form.addressLine2}
                          onChange={handleChange}
                          autoComplete="address-line2"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-black/74">Country*</span>
                        <input
                          className={inputClassName}
                          name="country"
                          value={form.country}
                          onChange={handleChange}
                          autoComplete="country-name"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-black/74">Town / City*</span>
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
                        <span className="text-sm font-medium text-black/74">State*</span>
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
                        <span className="text-sm font-medium text-black/74">Postcode / Zip*</span>
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
                        <span className="text-sm font-medium text-black/74">Phone Number*</span>
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
                        <span className="text-sm font-medium text-black/74">Alternate Phone</span>
                        <input
                          className={inputClassName}
                          name="alternatePhoneNumber"
                          value={form.alternatePhoneNumber}
                          onChange={handleChange}
                          inputMode="tel"
                          autoComplete="tel-national"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-black/74">Address Tag</span>
                        <input
                          className={inputClassName}
                          name="addressLabel"
                          value={form.addressLabel}
                          onChange={handleChange}
                          placeholder="Home, Office, Village Home"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm leading-6 text-black/58">
                        Choose whether this address should be saved to your account for future orders. Live current-location assist is available from the summary card above.
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="btn btn-outline h-[46px] rounded-full px-5 text-sm disabled:opacity-60"
                      >
                        {isLocating ? "Fetching..." : "Fetch current location"}
                      </button>
                    </div>

                    {hasMatchingSavedAddress ? (
                      <div className="rounded-[14px] border border-black/8 bg-[#fffdfa] px-4 py-3 text-sm leading-6 text-black/68">
                        This billing setup is already backed by one of your saved addresses in the account.
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 rounded-[14px] border border-black/8 px-4 py-3 text-sm text-black/72">
                        <input
                          type="checkbox"
                          checked={saveAddressForFuture}
                          onChange={(event) => setSaveAddressForFuture(event.target.checked)}
                          className="h-4 w-4 rounded border-black/20"
                        />
                        Save this address to my account for the next time
                      </label>
                    )}
                    </m.div>
                  </m.div>
                </m.div>
              ) : null}
            </AnimatePresence>
          </div>

        </div>

        {orderSummary}
      </div>
    </section>
  );
}

export default Checkout;
