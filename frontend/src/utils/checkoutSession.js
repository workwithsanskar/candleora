import {
  AUTH_STORAGE_KEY,
  CHECKOUT_LAST_ORDER_STORAGE_KEY,
  CHECKOUT_SESSION_STORAGE_KEY,
  clearSessionJson,
  clearStoredJson,
  readSessionJson,
  readStoredJson,
  writeSessionJson,
  writeStoredJson,
} from "./storage";

const TIMER_WINDOW_MS = 10 * 60 * 1000;

function normalizeScopeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSessionScope(user = null) {
  const normalizedUserId = normalizeScopeValue(user?.id);
  if (normalizedUserId) {
    return `user-${normalizedUserId}`;
  }

  const normalizedEmail = normalizeScopeValue(user?.email);
  if (normalizedEmail) {
    return `email-${normalizedEmail}`;
  }

  return "guest";
}

export function getCheckoutSessionStorageKey(user = null) {
  return `${CHECKOUT_SESSION_STORAGE_KEY}.${getSessionScope(user)}`;
}

export function createEmptyCheckoutSession() {
  return {
    source: null,
    items: [],
    coupon: null,
    priceSummary: {
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      savings: 0,
      catalogSavings: 0,
    },
    addressId: null,
    paymentMethod: null,
    whatsappOptIn: false,
    timerExpiry: null,
    addressCompleted: false,
  };
}

export function getCheckoutLastOrderStorageKey(user = null) {
  return `${CHECKOUT_LAST_ORDER_STORAGE_KEY}.${getSessionScope(user)}`;
}

export function createSessionItemFromProduct(product, quantity = 1) {
  const normalizedQuantity = Math.max(1, Number(quantity ?? 1));
  const unitPrice = Number(product?.price ?? 0);
  const originalPrice = Number(product?.originalPrice ?? product?.price ?? 0);

  return {
    productId: Number(product?.id),
    slug: product?.slug ?? "",
    productName: product?.name ?? "CandleOra candle",
    imageUrl: Array.isArray(product?.imageUrls) ? product.imageUrls[0] ?? "" : product?.imageUrl ?? "",
    quantity: normalizedQuantity,
    unitPriceSnapshot: unitPrice,
    originalPriceSnapshot: originalPrice,
    stockSnapshot: Number(product?.stock ?? 0),
    lowStockThresholdSnapshot: Number(product?.lowStockThreshold ?? 10),
    occasionTag: product?.occasionTag ?? "",
  };
}

export function createSessionItemFromCartItem(item) {
  return {
    productId: Number(item?.productId ?? item?.id),
    slug: item?.slug ?? "",
    productName: item?.productName ?? item?.name ?? "CandleOra candle",
    imageUrl: item?.imageUrl ?? "",
    quantity: Math.max(1, Number(item?.quantity ?? 1)),
    unitPriceSnapshot: Number(item?.unitPrice ?? 0),
    originalPriceSnapshot: Number(item?.originalUnitPrice ?? item?.unitPrice ?? 0),
    stockSnapshot: Number(item?.stock ?? 0),
    lowStockThresholdSnapshot: Number(item?.lowStockThreshold ?? 10),
    occasionTag: item?.occasionTag ?? "",
  };
}

export function createCartCheckoutSession(cartItems = []) {
  const session = {
    ...createEmptyCheckoutSession(),
    source: "cart",
    items: cartItems.map(createSessionItemFromCartItem),
  };

  return withComputedPriceSummary(session);
}

export function createBuyNowCheckoutSession(product, quantity = 1) {
  const session = {
    ...createEmptyCheckoutSession(),
    source: "buy-now",
    items: [createSessionItemFromProduct(product, quantity)],
  };

  return withComputedPriceSummary(session);
}

export function withComputedPriceSummary(session) {
  const subtotal = sumSessionItems(session?.items);
  const catalogSavings = sumCatalogSavings(session?.items);
  const discount = Number(session?.coupon?.quote?.discountAmount ?? 0);
  const total = Number(session?.coupon?.quote?.totalAmount ?? subtotal);

  return {
    ...session,
    priceSummary: {
      subtotal,
      discount,
      shipping: 0,
      total,
      savings: Math.max(0, catalogSavings + discount),
      catalogSavings,
    },
  };
}

export function setSessionCoupon(session, code, quote) {
  return withComputedPriceSummary({
    ...session,
    coupon: code && quote
      ? {
          code,
          quote,
          appliedAt: Date.now(),
        }
      : null,
  });
}

export function ensureSessionTimer(session) {
  if (session?.timerExpiry) {
    return session;
  }

  return {
    ...session,
    timerExpiry: Date.now() + TIMER_WINDOW_MS,
  };
}

export function refreshExpiredPromotions(session) {
  if (!session?.timerExpiry || session.timerExpiry > Date.now()) {
    return session;
  }

  return withComputedPriceSummary({
    ...session,
    coupon: null,
    timerExpiry: null,
  });
}

export function getCheckoutTimerWindowMs() {
  return TIMER_WINDOW_MS;
}

export function buildCheckoutOrderPayload(session, address, user = null) {
  const normalizedSource = String(session?.source ?? "cart").trim().toLowerCase() === "buy-now"
    ? "BUY_NOW"
    : "CART";

  return {
    shippingName: address?.recipientName ?? user?.name ?? "",
    phone: address?.phoneNumber ?? user?.phoneNumber ?? "",
    contactEmail: user?.email ?? "",
    alternatePhoneNumber: user?.alternatePhoneNumber ?? null,
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "India",
    locationLabel: address?.label ?? null,
    latitude: null,
    longitude: null,
    couponCode: session?.coupon?.code ?? null,
    paymentMethod: session?.paymentMethod ?? "COD",
    checkoutSource: normalizedSource,
    items: (session?.items ?? []).map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity ?? 1),
    })),
  };
}

export function readCheckoutSessionForUser(user = null) {
  const scopedKey = getCheckoutSessionStorageKey(user);
  const scopedSession = readStoredJson(scopedKey, null);
  if (isSessionShape(scopedSession)) {
    return withComputedPriceSummary(refreshExpiredPromotions(scopedSession));
  }

  return createEmptyCheckoutSession();
}

export function writeCheckoutSessionForUser(user = null, session = null) {
  const scopedKey = getCheckoutSessionStorageKey(user);

  if (!session || !session.source || !Array.isArray(session.items) || !session.items.length) {
    clearStoredJson(scopedKey);
    return;
  }

  writeStoredJson(scopedKey, withComputedPriceSummary(session));
}

export function clearCheckoutSessionForUser(user = null) {
  clearStoredJson(getCheckoutSessionStorageKey(user));
}

export function clearCheckoutSessionForStoredSession() {
  const session = readStoredJson(AUTH_STORAGE_KEY, null);
  clearCheckoutSessionForUser(session?.user ?? null);
}

export function writeLastPlacedOrderIdForUser(user = null, orderId = null) {
  const scopedKey = getCheckoutLastOrderStorageKey(user);

  if (!orderId) {
    clearSessionJson(scopedKey);
    return;
  }

  writeSessionJson(scopedKey, {
    orderId: Number(orderId),
    storedAt: Date.now(),
  });
}

export function readLastPlacedOrderIdForUser(user = null) {
  const scopedKey = getCheckoutLastOrderStorageKey(user);
  const payload = readSessionJson(scopedKey, null);
  const orderId = Number(payload?.orderId ?? 0);
  return orderId > 0 ? orderId : null;
}

export function clearLastPlacedOrderIdForUser(user = null) {
  clearSessionJson(getCheckoutLastOrderStorageKey(user));
}

function isSessionShape(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sumSessionItems(items = []) {
  return items.reduce(
    (total, item) => total + Number(item.unitPriceSnapshot ?? 0) * Number(item.quantity ?? 1),
    0,
  );
}

function sumCatalogSavings(items = []) {
  return items.reduce((total, item) => {
    const currentPrice = Number(item.unitPriceSnapshot ?? 0);
    const originalPrice = Number(item.originalPriceSnapshot ?? currentPrice);
    const quantity = Number(item.quantity ?? 1);
    const delta = Math.max(0, originalPrice - currentPrice);
    return total + delta * quantity;
  }, 0);
}
