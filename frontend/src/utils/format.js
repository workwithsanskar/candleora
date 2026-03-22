export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateRange(startValue, endValue) {
  if (!startValue && !endValue) {
    return "Delivery estimate will be confirmed soon";
  }

  if (startValue && endValue) {
    return `${formatDate(startValue)} - ${formatDate(endValue)}`;
  }

  return formatDate(startValue ?? endValue);
}

export function titleCase(value) {
  const normalized = String(value ?? "");

  if (normalized && normalized === normalized.toUpperCase() && normalized.length <= 8) {
    return normalized;
  }

  return normalized
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatApiError(error) {
  const payload = error?.response?.data;
  const status = error?.response?.status;
  const firebaseCode =
    typeof error?.code === "string" && error.code.startsWith("auth/")
      ? error.code
      : null;

  if (firebaseCode) {
    return formatFirebaseError(firebaseCode);
  }

  if (!error?.response) {
    return "We couldn't reach CandleOra right now. The backend may be unavailable or waking up. Please try again in a moment.";
  }

  if (status === 409) {
    return payload?.message ?? "This email is already registered. Try logging in instead.";
  }

  if (status === 401) {
    if (payload?.message === "Phone authentication failed") {
      return "The OTP could not be verified. Please request a new code and try again.";
    }

    return payload?.message ?? "Invalid email or password.";
  }

  if (status === 503 && payload?.message === "Phone authentication is not configured on the server") {
    return "Phone OTP login is not configured on the server yet. Add the Firebase project ID on the backend and try again.";
  }

  if (status >= 500) {
    return payload?.message ?? "The server hit an issue while processing your request. Please try again.";
  }

  return (
    payload?.message ??
    payload?.detail ??
    (typeof payload === "string" ? payload : null) ??
    error?.message ??
    "Something went wrong. Please try again."
  );
}

function formatFirebaseError(code) {
  switch (code) {
    case "auth/invalid-phone-number":
      return "Enter a valid mobile number with the country code.";
    case "auth/missing-phone-number":
      return "Enter your mobile number to continue.";
    case "auth/invalid-verification-code":
      return "The OTP you entered is incorrect. Please try again.";
    case "auth/code-expired":
      return "This OTP has expired. Request a new code and try again.";
    case "auth/missing-verification-code":
      return "Enter the OTP to continue.";
    case "auth/quota-exceeded":
      return "OTP quota has been reached for now. Please try again later.";
    case "auth/too-many-requests":
      return "Too many OTP attempts were made. Please wait a bit before trying again.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA verification failed. Please retry the OTP request.";
    case "auth/network-request-failed":
      return "We couldn't reach Firebase right now. Check your connection and try again.";
    case "auth/configuration-not-found":
      return "Firebase phone auth is not configured for this project yet. Enable Phone sign-in in Firebase Authentication and verify your app settings.";
    case "auth/operation-not-allowed":
      return "Phone sign-in is not enabled for this Firebase project yet. Turn it on in Firebase Authentication and try again.";
    case "auth/app-not-authorized":
      return "This domain is not authorized for Firebase phone sign-in. Add your current site to Firebase authorized domains and try again.";
    default:
      return errorMessageFromCode(code);
  }
}

function errorMessageFromCode(code) {
  const label = String(code).replace(/^auth\//, "").replace(/-/g, " ");
  if (!label) {
    return "Something went wrong. Please try again.";
  }

  return label.charAt(0).toUpperCase() + label.slice(1) + ".";
}
