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

export function formatDateTime(value) {
  if (!value) {
    return "Soon";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export function formatTimeRemaining(endValue, nowValue = Date.now()) {
  if (!endValue) {
    return "";
  }

  const endTime = new Date(endValue).getTime();
  const diffMs = endTime - Number(nowValue);

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return "Window closed";
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  if (minutes > 0) {
    return `${minutes}m remaining`;
  }

  return "Less than a minute remaining";
}

export function titleCase(value) {
  const normalized = String(value ?? "");

  if (normalized === "PHONEPE") {
    return "PhonePe";
  }

  if (normalized === "RAZORPAY") {
    return "Razorpay";
  }

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
  const isAxiosRequest = Boolean(error?.config);
  const firebaseCode =
    typeof error?.code === "string" && error.code.startsWith("auth/")
      ? error.code
      : null;
  const message = String(
    error?.message ??
      payload?.message ??
      payload?.detail ??
      "",
  );

  if (firebaseCode) {
    return formatFirebaseError(firebaseCode);
  }

  if (/billing not enabled/i.test(message)) {
    return "Firebase phone verification needs billing enabled on this project. Add a billing account in Firebase/Google Cloud, then try sending the OTP again.";
  }

  if (/origin is not allowed/i.test(message)) {
    return "This Google sign-in origin is not authorized yet. Add http://localhost:5173 to the Google OAuth client's Authorized JavaScript origins.";
  }

  if (!error?.response) {
    if (/cloudinary cloud name is not configured/i.test(message)) {
      return "Proof uploads are not configured yet. Add VITE_CLOUDINARY_CLOUD_NAME to frontend/.env and try again.";
    }

    if (!isAxiosRequest && /proof upload failed|failed to fetch|networkerror when attempting to fetch/i.test(message)) {
      return "We couldn't upload your proof files right now. Please check the Cloudinary setup and try again.";
    }

    if (!isAxiosRequest && message) {
      return message;
    }

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

  if (status === 503 && payload?.message === "PhonePe is not configured on the server") {
    return "Online payment is not active yet. PhonePe will be enabled once the merchant credentials are added.";
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
