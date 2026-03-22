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
    locationLabel: user?.locationLabel ?? "",
    latitude: normalizeNumberForForm(user?.latitude),
    longitude: normalizeNumberForForm(user?.longitude),
    paymentMethod: "RAZORPAY",
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
    locationLabel: form.locationLabel,
    latitude: normalizeNumber(form.latitude),
    longitude: normalizeNumber(form.longitude),
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
