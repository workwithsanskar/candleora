import {
  AUTH_STORAGE_KEY,
  CHECKOUT_DRAFT_STORAGE_KEY,
  clearStoredJson,
  readStoredJson,
  writeStoredJson,
} from "./storage";

function normalizeScopeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeName(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getCheckoutDraftStorageKey(user = null) {
  const normalizedUserId = normalizeScopeValue(user?.id);
  if (normalizedUserId) {
    return `${CHECKOUT_DRAFT_STORAGE_KEY}.user-${normalizedUserId}`;
  }

  const normalizedEmail = normalizeScopeValue(user?.email);
  if (normalizedEmail) {
    return `${CHECKOUT_DRAFT_STORAGE_KEY}.email-${normalizedEmail}`;
  }

  return `${CHECKOUT_DRAFT_STORAGE_KEY}.guest`;
}

export function isCheckoutDraftCompatibleWithUser(draft = {}, user = null) {
  if (!user) {
    return true;
  }

  const draftEmail = normalizeEmail(draft?.contactEmail);
  const userEmail = normalizeEmail(user?.email);
  if (draftEmail && userEmail) {
    return draftEmail === userEmail;
  }

  const draftPhone = normalizePhone(draft?.phone);
  const userPhone = normalizePhone(user?.phoneNumber);
  const draftName = normalizeName(draft?.shippingName);
  const userName = normalizeName(user?.name);
  if (draftPhone && userPhone && draftName && userName) {
    return draftPhone === userPhone && draftName === userName;
  }

  return true;
}

export function readCheckoutDraftForUser(user = null) {
  const scopedKey = getCheckoutDraftStorageKey(user);
  const scopedDraft = readStoredJson(scopedKey, null);
  if (scopedDraft && typeof scopedDraft === "object" && !Array.isArray(scopedDraft)) {
    return scopedDraft;
  }

  const legacyDraft = readStoredJson(CHECKOUT_DRAFT_STORAGE_KEY, null);
  if (!legacyDraft || typeof legacyDraft !== "object" || Array.isArray(legacyDraft)) {
    return {};
  }

  clearStoredJson(CHECKOUT_DRAFT_STORAGE_KEY);

  if (!isCheckoutDraftCompatibleWithUser(legacyDraft, user)) {
    return {};
  }

  writeStoredJson(scopedKey, legacyDraft);
  return legacyDraft;
}

export function writeCheckoutDraftForUser(user = null, draft = {}) {
  writeStoredJson(getCheckoutDraftStorageKey(user), draft);
}

export function clearCheckoutDraftForUser(user = null) {
  clearStoredJson(getCheckoutDraftStorageKey(user));
  clearStoredJson(CHECKOUT_DRAFT_STORAGE_KEY);
}

export function clearCheckoutDraftForStoredSession() {
  const session = readStoredJson(AUTH_STORAGE_KEY, null);
  clearCheckoutDraftForUser(session?.user ?? null);
}
