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
];

const indianPhonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const postalCodePattern = /^\d{6}$/;
const SAMPLE_COUPON_CODE = String(import.meta.env.VITE_SAMPLE_COUPON_CODE ?? "").trim();
const SAMPLE_COUPON_HINT = String(import.meta.env.VITE_SAMPLE_COUPON_HINT ?? "").trim();

function Checkout() {
  const navigate = useNavigate();
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
      setError("Complete the billing details before placing the order.");
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
      locationLabel: address.label || current.locationLabel,
    }));
    setSaveAddressForFuture(false);
    toast.success("Saved address applied.");
  };

  const hasMatchingSavedAddress = useMemo(() => {
    const currentKey = [
      form.locationLabel,
      form.shippingName,
      form.addressLine1,
      form.addressLine2,
      form.city,
      form.state,
      form.postalCode,
      form.country,
      form.phone,
    ]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .join("|");

    return savedAddresses.some((address) => {
      const addressKey = [
        address.label,
        address.recipientName,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.postalCode,
        address.country,
        address.phoneNumber,
      ]
        .map((value) => String(value ?? "").trim().toLowerCase())
        .join("|");

      return addressKey === currentKey;
    });
  }, [form, savedAddresses]);

  const persistCheckoutAddressIfNeeded = async () => {
    if (!isAuthenticated || !saveAddressForFuture || hasMatchingSavedAddress) {
      return;
    }

    await createAddress({
      label: form.locationLabel || "Saved Address",
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

      await persistCheckoutAddressIfNeeded();

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
            <Link to="/shop" className="btn btn-primary mt-6">
              Continue shopping
            </Link>
          }
        />
      </section>
    );
  }

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
        />
        <button
          type="button"
          className="btn btn-secondary h-[48px] shrink-0 rounded-full px-6"
          onClick={handleApplyCoupon}
          disabled={isApplyingCoupon}
        >
          {isApplyingCoupon ? "Applying..." : "Apply"}
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
              className="btn btn-outline shrink-0 whitespace-nowrap rounded-full"
              onClick={handleUseSampleCoupon}
              disabled={isApplyingCoupon}
            >
              {isApplyingCoupon ? "Applying..." : "Use coupon"}
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
          {couponQuote && (
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-black underline underline-offset-4"
              onClick={handleClearCoupon}
            >
              Remove coupon
            </button>
          )}
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

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePlaceOrder}
            className="btn btn-success h-[52px] w-full rounded-[10px] text-base disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="space-y-3">
        <h1 className="page-title">Checkout</h1>
        <p className="max-w-[860px] text-body leading-7 text-black/58">
          Match your delivery details, apply a coupon if you have one, and review the cart before placing the order.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
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
            <div className="rounded-[16px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-black">Use a saved address</p>
                  <p className="mt-1 text-sm leading-6 text-black/62">
                    Pick a saved delivery address and fill the form in one tap.
                  </p>
                </div>
                <Link
                  to="/profile/details#addresses"
                  className="text-sm font-semibold text-black underline underline-offset-4"
                >
                  Manage addresses
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {savedAddresses.slice(0, 2).map((address) => (
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
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
            <div className="bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white">
              Billing Details
            </div>

            <div className="space-y-6 px-6 py-6 sm:px-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
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

                <label className="space-y-2 sm:col-span-2">
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

                <label className="space-y-2 sm:col-span-2">
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

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-black/74">Address Line 2</span>
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

                <label className="space-y-2">
                  <span className="text-sm font-medium text-black/74">Address Tag</span>
                  <input
                    className={inputClassName}
                    name="locationLabel"
                    value={form.locationLabel}
                    onChange={handleChange}
                    placeholder="Home, Office, Studio"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-6 text-black/58">
                  Choose whether this address should be saved to your account for future orders.
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="btn btn-outline h-[46px] rounded-full px-5 text-sm disabled:opacity-60"
                >
                  {isLocating ? "Detecting..." : "Use current location"}
                </button>
              </div>

              <label className="flex items-center gap-3 rounded-[14px] border border-black/8 px-4 py-3 text-sm text-black/72">
                <input
                  type="checkbox"
                  checked={saveAddressForFuture}
                  onChange={(event) => setSaveAddressForFuture(event.target.checked)}
                  className="h-4 w-4 rounded border-black/20"
                />
                Save this address to my account for the next time
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-black/12 bg-white shadow-md">
            <div className="bg-black px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white">
              Payment
            </div>

            <div className="grid gap-4 px-6 py-6 sm:px-7">
              {[
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
              ].map((method) => (
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

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          {!PHONEPE_ENABLED && (
            <p className="text-sm leading-6 text-brand-dark/62">{PHONEPE_COMING_SOON_MESSAGE}</p>
          )}
        </div>

        {orderSummary}
      </div>
    </section>
  );
}

export default Checkout;
