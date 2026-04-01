export const SUPPORTED_COUNTRY_NAME = "India";

export const INDIA_STATE_OPTIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const INDIA_STATE_ALIASES = {
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  chandigarh: "Chandigarh",
  "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  delhi: "Delhi",
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  "jammu & kashmir": "Jammu and Kashmir",
  "jammu and kashmir": "Jammu and Kashmir",
  ladakh: "Ladakh",
  lakshadweep: "Lakshadweep",
  odisha: "Odisha",
  orissa: "Odisha",
  pondicherry: "Puducherry",
  puducherry: "Puducherry",
  uttaranchal: "Uttarakhand",
};

export function normalizePostalCode(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

export function buildAddressDraft(source = null) {
  const safeSource = source ?? {};

  return {
    id: safeSource.id ?? "",
    label: safeSource.label ?? safeSource.locationLabel ?? "",
    recipientName: safeSource.recipientName ?? safeSource.name ?? "",
    phoneNumber: safeSource.phoneNumber ?? safeSource.phone ?? "",
    addressLine1: safeSource.addressLine1 ?? "",
    addressLine2: safeSource.addressLine2 ?? "",
    city: safeSource.city ?? "",
    state: safeSource.state ?? "",
    postalCode: safeSource.postalCode ?? "",
    country: safeSource.country ?? "India",
    isDefault: Boolean(safeSource.isDefault),
  };
}

export function buildLegacyProfileAddressDraft(user = null) {
  if (!user) {
    return null;
  }

  const candidate = buildAddressDraft({
    label: user.locationLabel ?? "",
    recipientName: user.name ?? "",
    phoneNumber: user.phoneNumber ?? "",
    addressLine1: user.addressLine1 ?? "",
    addressLine2: user.addressLine2 ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    postalCode: user.postalCode ?? "",
    country: user.country ?? "India",
    isDefault: true,
  });

  if (
    !candidate.recipientName ||
    !candidate.phoneNumber ||
    !candidate.addressLine1 ||
    !candidate.city ||
    !candidate.state ||
    !candidate.postalCode
  ) {
    return null;
  }

  return candidate;
}

export function filterAddresses(addresses = [], query = "") {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return addresses;
  }

  return addresses.filter((address) =>
    [
      address.recipientName,
      address.phoneNumber,
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
      address.label,
    ]
      .map(normalizeText)
      .some((value) => value.includes(normalizedQuery)),
  );
}

export function formatAddressLines(address = {}) {
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function formatAddressPreview(address = {}) {
  const streetLine = [address.addressLine1, address.addressLine2].filter(Boolean).join(", ");
  const regionLine = [address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");

  return {
    streetLine,
    regionLine,
  };
}

export function getDefaultAddress(addresses = []) {
  return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
}

export function normalizeCountryName(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  return normalized === "india" ? SUPPORTED_COUNTRY_NAME : String(value ?? "").trim();
}

export function normalizeStateName(value, country = SUPPORTED_COUNTRY_NAME) {
  const trimmedValue = String(value ?? "").trim();
  if (!trimmedValue) {
    return "";
  }

  if (normalizeCountryName(country) !== SUPPORTED_COUNTRY_NAME) {
    return trimmedValue;
  }

  const normalized = normalizeText(trimmedValue);
  const directMatch = INDIA_STATE_OPTIONS.find((option) => normalizeText(option) === normalized);
  if (directMatch) {
    return directMatch;
  }

  return INDIA_STATE_ALIASES[normalized] ?? trimmedValue;
}

export function validateAddressRegion({ state = "", country = "" } = {}) {
  const normalizedCountry = normalizeCountryName(country);
  const normalizedState = normalizeStateName(state, normalizedCountry);

  if (!normalizedCountry) {
    return {
      isValid: false,
      country: "",
      state: normalizedState,
      fieldErrors: {
        country: "Enter your country.",
      },
    };
  }

  if (normalizedCountry !== SUPPORTED_COUNTRY_NAME) {
    return {
      isValid: false,
      country: normalizedCountry,
      state: normalizedState,
      fieldErrors: {
        country: `We currently support addresses in ${SUPPORTED_COUNTRY_NAME} only.`,
      },
    };
  }

  if (!normalizedState) {
    return {
      isValid: false,
      country: normalizedCountry,
      state: "",
      fieldErrors: {
        state: "Enter your state.",
      },
    };
  }

  const stateExists = INDIA_STATE_OPTIONS.some(
    (option) => normalizeText(option) === normalizeText(normalizedState),
  );

  if (!stateExists) {
    return {
      isValid: false,
      country: normalizedCountry,
      state: normalizedState,
      fieldErrors: {
        state: "Enter a valid Indian state or union territory.",
      },
    };
  }

  return {
    isValid: true,
    country: normalizedCountry,
    state: normalizedState,
    fieldErrors: {},
  };
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}
