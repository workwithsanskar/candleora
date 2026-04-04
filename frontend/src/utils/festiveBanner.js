import {
  clearSessionJson,
  clearStoredJson,
  readSessionJson,
  readStoredJson,
  writeSessionJson,
  writeStoredJson,
} from "./storage";

export const FESTIVE_BANNER_DISMISS_KEY = "candleora.festive-banner.dismissed";
export const FESTIVE_BANNER_SESSION_DISMISS_KEY = "candleora.festive-banner.session-dismissed";
export const FESTIVE_BANNER_COUPON_KEY = "candleora.festive-banner.pending-coupon";

function normalizeBannerId(bannerId) {
  return String(bannerId ?? "").trim();
}

export function isFestiveBannerDismissed(banner) {
  const bannerId = normalizeBannerId(banner?.id);
  if (!bannerId) {
    return false;
  }

  if (banner?.showOnce) {
    const dismissedMap = readStoredJson(FESTIVE_BANNER_DISMISS_KEY, {});
    return Boolean(dismissedMap?.[bannerId]);
  }

  const dismissedMap = readSessionJson(FESTIVE_BANNER_SESSION_DISMISS_KEY, {});
  return Boolean(dismissedMap?.[bannerId]);
}

export function dismissFestiveBanner(banner) {
  const bannerId = normalizeBannerId(banner?.id);
  if (!bannerId) {
    return;
  }

  if (banner?.showOnce) {
    const dismissedMap = readStoredJson(FESTIVE_BANNER_DISMISS_KEY, {});
    writeStoredJson(FESTIVE_BANNER_DISMISS_KEY, {
      ...dismissedMap,
      [bannerId]: true,
    });
    return;
  }

  const dismissedMap = readSessionJson(FESTIVE_BANNER_SESSION_DISMISS_KEY, {});
  writeSessionJson(FESTIVE_BANNER_SESSION_DISMISS_KEY, {
    ...dismissedMap,
    [bannerId]: true,
  });
}

export function storePendingFestiveCoupon(payload) {
  writeStoredJson(FESTIVE_BANNER_COUPON_KEY, payload);
}

export function readPendingFestiveCoupon() {
  return readStoredJson(FESTIVE_BANNER_COUPON_KEY, null);
}

export function clearPendingFestiveCoupon() {
  clearStoredJson(FESTIVE_BANNER_COUPON_KEY);
}

export function clearFestiveBannerDismissals() {
  clearStoredJson(FESTIVE_BANNER_DISMISS_KEY);
  clearSessionJson(FESTIVE_BANNER_SESSION_DISMISS_KEY);
}
