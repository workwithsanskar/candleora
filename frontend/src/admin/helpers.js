import { titleCase } from "../utils/format";

export const FILTER_FIELD_CLASS =
  "h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20";

export const FILTER_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted";

export const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-2xl bg-[#17120f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black";

export const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark transition hover:border-black/20 hover:bg-black/5";

export const ORDER_STATUS_OPTIONS = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export function formatAdminStatus(value) {
  return titleCase(value);
}

export function statusClassName(value) {
  switch (String(value ?? "").toUpperCase()) {
    case "CONFIRMED":
    case "DELIVERED":
      return "bg-[#e7f7ea] text-success";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-[#ebf3ff] text-[#2659b7]";
    case "CANCELLED":
      return "bg-[#fdeaea] text-danger";
    case "LOW STOCK":
      return "bg-[#fff3dd] text-[#986700]";
    case "OUT OF STOCK":
      return "bg-[#fdeaea] text-danger";
    case "HIDDEN":
      return "bg-black/8 text-brand-muted";
    default:
      return "bg-[#fff3dd] text-[#986700]";
  }
}

export function resolveQuickRange(period) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  const normalizedPeriod = String(period ?? "LAST_30_DAYS").toUpperCase();

  if (normalizedPeriod === "LAST_7_DAYS") {
    startDate.setDate(endDate.getDate() - 6);
  } else if (normalizedPeriod === "LAST_90_DAYS") {
    startDate.setDate(endDate.getDate() - 89);
  } else {
    startDate.setDate(endDate.getDate() - 29);
  }

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}
