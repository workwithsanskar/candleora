export const AUTH_STORAGE_KEY = "candleora.auth";
export const GUEST_CART_STORAGE_KEY = "candleora.guest-cart";
export const WISHLIST_STORAGE_KEY = "candleora.wishlist";
export const CHECKOUT_DRAFT_STORAGE_KEY = "candleora.checkout-draft";
export const CHECKOUT_SESSION_STORAGE_KEY = "candleora.checkout-session";
export const CHECKOUT_LAST_ORDER_STORAGE_KEY = "candleora.checkout-last-order";
export const SAVED_ADDRESSES_STORAGE_KEY = "candleora.saved-addresses";
export const AURA_CHAT_STORAGE_KEY = "candleora.aura-chat";

export function buildAuraChatStorageKey(scope = "guest") {
  const normalizedScope = String(scope ?? "guest").trim().toLowerCase() || "guest";
  return `${AURA_CHAT_STORAGE_KEY}:${encodeURIComponent(normalizedScope)}`;
}

export function readStoredJson(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeStoredJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStoredJson(key) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

export function readSessionJson(key, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeSessionJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function clearSessionJson(key) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}
