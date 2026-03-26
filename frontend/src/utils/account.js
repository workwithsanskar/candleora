import { PHONEPE_ENABLED } from "./payments";

export const accountFormDefaults = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  alternatePhoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  gender: "",
  dateOfBirth: "",
  locationLabel: "",
  latitude: "",
  longitude: "",
};

export function createAccountForm(user = {}) {
  return {
    ...accountFormDefaults,
    name: user?.name ?? "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    alternatePhoneNumber: user?.alternatePhoneNumber ?? "",
    addressLine1: user?.addressLine1 ?? "",
    addressLine2: user?.addressLine2 ?? "",
    city: user?.city ?? "",
    state: user?.state ?? "",
    postalCode: user?.postalCode ?? "",
    country: user?.country ?? "",
    gender: user?.gender ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
    locationLabel: user?.locationLabel ?? "",
    latitude: normalizeNumberForForm(user?.latitude),
    longitude: normalizeNumberForForm(user?.longitude),
  };
}

export function createCheckoutForm(user = {}) {
  return {
    shippingName: user?.name ?? "",
    phone: user?.phoneNumber ?? "",
    contactEmail: user?.email ?? "",
    alternatePhoneNumber: user?.alternatePhoneNumber ?? "",
    addressLine1: user?.addressLine1 ?? "",
    addressLine2: user?.addressLine2 ?? "",
    city: user?.city ?? "",
    state: user?.state ?? "",
    postalCode: user?.postalCode ?? "",
    country: user?.country ?? "",
    locationLabel: user?.locationLabel ?? "",
    latitude: normalizeNumberForForm(user?.latitude),
    longitude: normalizeNumberForForm(user?.longitude),
    couponCode: "",
    paymentMethod: PHONEPE_ENABLED ? "PHONEPE" : "COD",
  };
}

export function mergeCheckoutFormWithUser(draft = {}, user = {}) {
  const base = createCheckoutForm(user);

  return {
    ...base,
    ...draft,
    shippingName: draft?.shippingName || base.shippingName,
    phone: draft?.phone || base.phone,
    contactEmail: draft?.contactEmail || base.contactEmail,
    alternatePhoneNumber: draft?.alternatePhoneNumber || base.alternatePhoneNumber,
    addressLine1: draft?.addressLine1 || base.addressLine1,
    addressLine2: draft?.addressLine2 || base.addressLine2,
    city: draft?.city || base.city,
    state: draft?.state || base.state,
    postalCode: draft?.postalCode || base.postalCode,
    country: draft?.country || base.country,
    locationLabel: draft?.locationLabel || base.locationLabel,
    latitude: draft?.latitude || base.latitude,
    longitude: draft?.longitude || base.longitude,
    couponCode: draft?.couponCode || base.couponCode,
    paymentMethod: draft?.paymentMethod || base.paymentMethod,
  };
}

export function buildSignupPayload(form) {
  return {
    name: form.name,
    email: form.email,
    password: form.password,
    ...buildSharedProfilePayload(form),
  };
}

export function buildGooglePayload(form, credential) {
  return {
    credential,
    name: form.name,
    ...buildSharedProfilePayload(form),
  };
}

export function buildPhonePayload(form, idToken, phoneNumber = "") {
  return {
    idToken,
    name: form.name,
    email: form.email || null,
    phoneNumber: phoneNumber || form.phoneNumber || null,
    ...buildSharedProfilePayload(form),
  };
}

export function buildProfilePayload(form) {
  return {
    name: form.name,
    ...buildSharedProfilePayload(form),
  };
}

export function buildCheckoutPayload(form, items) {
  return {
    shippingName: form.shippingName,
    phone: form.phone,
    contactEmail: form.contactEmail,
    alternatePhoneNumber: form.alternatePhoneNumber,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    country: form.country,
    locationLabel: form.locationLabel,
    latitude: normalizeNumber(form.latitude),
    longitude: normalizeNumber(form.longitude),
    couponCode: form.couponCode || null,
    paymentMethod: form.paymentMethod,
    items,
  };
}

function buildSharedProfilePayload(form) {
  return {
    phoneNumber: form.phoneNumber,
    alternatePhoneNumber: form.alternatePhoneNumber,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    country: form.country,
    gender: form.gender,
    dateOfBirth: form.dateOfBirth || null,
    locationLabel: form.locationLabel,
    latitude: normalizeNumber(form.latitude),
    longitude: normalizeNumber(form.longitude),
  };
}

function normalizeNumber(value) {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  return Number(value);
}

function normalizeNumberForForm(value) {
  return value === null || typeof value === "undefined" ? "" : String(value);
}
