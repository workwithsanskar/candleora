import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEY,
  CHECKOUT_DRAFT_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from "./storage";
import {
  clearCheckoutDraftForStoredSession,
  getCheckoutDraftStorageKey,
  readCheckoutDraftForUser,
} from "./checkoutStorage";

describe("checkoutStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("builds a user-scoped draft key when a user id is available", () => {
    expect(getCheckoutDraftStorageKey({ id: 42, email: "shopper@example.com" })).toBe(
      "candleora.checkout-draft.user-42",
    );
  });

  it("migrates a matching legacy draft into the current user's scoped key", () => {
    const user = { id: 7, email: "shopper@example.com" };
    const draft = {
      shippingName: "Shopper",
      contactEmail: "shopper@example.com",
      phone: "9876543210",
    };

    writeStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, draft);

    expect(readCheckoutDraftForUser(user)).toEqual(draft);
    expect(readStoredJson(getCheckoutDraftStorageKey(user), null)).toEqual(draft);
    expect(readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, null)).toBeNull();
  });

  it("drops a mismatched legacy draft instead of leaking it into another user account", () => {
    const user = { id: 8, email: "customer@example.com" };

    writeStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, {
      shippingName: "CandleOra Admin",
      contactEmail: "admin@candleora.com",
      phone: "9834849534",
    });

    expect(readCheckoutDraftForUser(user)).toEqual({});
    expect(readStoredJson(getCheckoutDraftStorageKey(user), null)).toBeNull();
    expect(readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, null)).toBeNull();
  });

  it("clears the scoped draft for the currently stored session user", () => {
    const user = { id: 11, email: "shopper@example.com" };
    const scopedKey = getCheckoutDraftStorageKey(user);

    writeStoredJson(AUTH_STORAGE_KEY, { token: "session-token", user });
    writeStoredJson(scopedKey, { shippingName: "Shopper", contactEmail: user.email });
    writeStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, { shippingName: "Legacy" });

    clearCheckoutDraftForStoredSession();

    expect(readStoredJson(scopedKey, null)).toBeNull();
    expect(readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, null)).toBeNull();
  });
});
