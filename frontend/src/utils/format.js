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

  if (!error?.response) {
    return "We couldn't reach CandleOra right now. The backend may be unavailable or waking up. Please try again in a moment.";
  }

  if (status === 409) {
    return payload?.message ?? "This email is already registered. Try logging in instead.";
  }

  if (status === 401) {
    return payload?.message ?? "Invalid email or password.";
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
