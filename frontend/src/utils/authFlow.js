export const COD_LIMIT = 3000;
export const PHONE_AUTH_ENABLED = String(import.meta.env.VITE_ENABLE_PHONE_AUTH ?? "false") === "true";
export const REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER =
  String(import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER ?? "false") === "true";

const PHONE_PLACEHOLDER_EMAIL_SUFFIX = "@auth.candleora.local";

export function requiresPhoneVerification(user) {
  if (!PHONE_AUTH_ENABLED || !REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER) {
    return false;
  }

  return !Boolean(user?.phoneVerified);
}

export function requiresEmailVerification(user) {
  const email = String(user?.email ?? "").trim().toLowerCase();

  if (!email || email.endsWith(PHONE_PLACEHOLDER_EMAIL_SUFFIX)) {
    return false;
  }

  return !Boolean(user?.emailVerified);
}

export function canUseCashOnDelivery(user, orderTotal) {
  if (REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER && !requiresPhoneVerification(user)) {
    return Number(orderTotal ?? 0) <= COD_LIMIT;
  }

  return Number(orderTotal ?? 0) <= COD_LIMIT;
}
