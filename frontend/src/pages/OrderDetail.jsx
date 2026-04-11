import { useEffect, useMemo, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useParams, useSearchParams } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.webp";
import CandleSelectControl from "../components/CandleSelectControl";
import Modal from "../components/Modal";
import ReplaceModal from "../components/ReplaceModal";
import StatusView from "../components/StatusView";
import OrderHistorySkeleton from "../components/OrderHistorySkeleton";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "../constants/support";
import { useAuth } from "../context/AuthContext";
import { catalogApi, orderApi } from "../services/api";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatTimeRemaining,
  titleCase,
} from "../utils/format";

const ORDER_FLOW = ["PENDING_PAYMENT", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const ORDER_LABELS = {
  PENDING_PAYMENT: "Placed",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};
const REPLACEMENT_FLOW = ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "SHIPPED", "DELIVERED"];
const CANCELLATION_POLICY_COPY =
  "You can cancel your order within 24 hours of placing it.";
const REPLACEMENT_POLICY_COPY =
  "You can request a replacement within 3 days of delivery only if the item is damaged or broken.";

function buildReviewDraft(reviewerName = "", reviewerEmail = "", rating = 5, message = "") {
  return {
    reviewerName,
    reviewerEmail,
    rating,
    message,
  };
}

function formatPaymentProviderLabel(provider) {
  const key = String(provider ?? "").toUpperCase();
  return (
    {
      COD: "Cash on delivery",
      UPI: "UPI",
      NETBANKING: "Net banking",
      CARD: "Card",
      WALLET: "Wallet",
      PHONEPE: "PhonePe",
      RAZORPAY: "Razorpay",
    }[key] || titleCase(key)
  );
}

function formatPaymentStatusLabel(status, provider) {
  const nextStatus = String(status ?? "").toUpperCase();
  if (nextStatus === "COD_PENDING" && String(provider ?? "").toUpperCase() === "COD") {
    return "Pay on delivery";
  }
  if (nextStatus === "PENDING") return "Awaiting payment";
  if (nextStatus === "PAID") return "Paid successfully";
  if (nextStatus === "FAILED") return "Payment issue";
  return titleCase(nextStatus);
}

function statusMeta(status) {
  const key = String(status ?? "").toUpperCase();

  if (key === "CANCELLED") {
    return {
      label: "Cancelled",
      pill: "border-danger/18 bg-[#fff3f3] text-danger",
      accent: "text-danger",
    };
  }

  if (key === "DELIVERED") {
    return {
      label: "Delivered",
      pill: "border-success/18 bg-[#eef8ee] text-success",
      accent: "text-success",
    };
  }

  if (key === "OUT_FOR_DELIVERY") {
    return {
      label: "Out for delivery",
      pill: "border-success/18 bg-[#eef8ee] text-success",
      accent: "text-success",
    };
  }

  if (key === "SHIPPED") {
    return {
      label: "In transit",
      pill: "border-black/10 bg-black/[0.04] text-brand-dark",
      accent: "text-brand-dark",
    };
  }

  return {
    label: key === "PENDING_PAYMENT" ? "Placed" : "Confirmed",
    pill: "border-brand-primary/20 bg-[#fff8e7] text-[#9a6200]",
    accent: "text-[#9a6200]",
  };
}

function trackerIndex(flow, status) {
  return flow.findIndex((step) => step === status);
}

function formatTrackingDate(value) {
  if (!value) return "00000000";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "00000000";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function trackingReference(order) {
  const orderNumber = String(order?.id ?? "").trim();
  if (!orderNumber) {
    return String(order?.trackingNumber || order?.gatewayOrderId || order?.invoiceNumber || "");
  }

  return `CNDL-${formatTrackingDate(order?.createdAt)}-${orderNumber}`;
}

function itemReplacement(replacements, itemId) {
  return replacements?.[itemId] ?? replacements?.[String(itemId)] ?? null;
}

function canRequestReplacement(order, replacement, readOnly) {
  return !readOnly && order?.canReplace && !replacement;
}

function SummaryRow({ label, value, valueClassName = "" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-black/54">{label}</span>
      <span className={`text-right text-sm font-medium text-brand-dark ${valueClassName}`.trim()}>
        {value}
      </span>
    </div>
  );
}

const ORDER_PROGRESS_COPY = {
  PENDING_PAYMENT: {
    title: "Awaiting payment",
    description:
      "We are waiting for payment confirmation before the order moves into production.",
    mobileSummary: "Your order is waiting for payment confirmation.",
  },
  CONFIRMED: {
    title: "Confirmed",
    description:
      "The order is verified and queued for packing inside the CandleOra studio.",
    mobileSummary: "Your order has been placed and verified by the team.",
  },
  SHIPPED: {
    title: "Shipped",
    description:
      "Your parcel has left CandleOra and is moving through the carrier network.",
    mobileSummary: "Your parcel has been handed to the delivery partner.",
  },
  OUT_FOR_DELIVERY: {
    title: "Out for delivery",
    description:
      "The final handoff is in progress and the package should arrive soon.",
    mobileSummary: "The package is on the final route and should arrive soon.",
  },
  DELIVERED: {
    title: "Delivered",
    description:
      "The package has been delivered and the order record is now complete.",
    mobileSummary: "The package has been delivered successfully.",
  },
};

function formatProgressStamp(step, order) {
  if (step === "DELIVERED" && order?.deliveredAt) {
    return formatDateTime(order.deliveredAt);
  }

  if (step === "PENDING_PAYMENT" || step === "CONFIRMED") {
    return formatDateTime(order?.createdAt);
  }

  if (step === "OUT_FOR_DELIVERY") {
    return order?.estimatedDeliveryEnd ? formatDate(order.estimatedDeliveryEnd) : "Expected soon";
  }

  if (step === "SHIPPED") {
    return order?.trackingNumber ? `Tracking ${order.trackingNumber}` : "Carrier update pending";
  }

  return "Pending";
}

function buildProgressSteps(order) {
  // Admin-managed tracking updates already flow through `order.trackingEvents`.
  // A delivery partner feed can later map into the same shape without changing this UI.
  const liveEvents = Array.isArray(order?.trackingEvents) ? order.trackingEvents : [];

  if (liveEvents.length > 0) {
    const eventMap = new Map(
      liveEvents.map((event) => [
        String(event.status ?? "").toUpperCase(),
        {
          detail: event.detail || event.description || "",
          timestamp: event.timestamp ? formatDateTime(event.timestamp) : "",
        },
      ]),
    );

    return ORDER_FLOW.map((step) => {
      const copy = ORDER_PROGRESS_COPY[step];
      const liveEvent = eventMap.get(step);

      return {
        step,
        title: copy.title,
        description: liveEvent?.detail || copy.description,
        mobileSummary: liveEvent?.detail || copy.mobileSummary,
        mobileMeta: liveEvent?.timestamp || formatProgressStamp(step, order),
      };
    });
  }

  return ORDER_FLOW.map((step) => {
    const copy = ORDER_PROGRESS_COPY[step];
    const courierLine =
      step === "SHIPPED" && order?.courierName && order?.trackingNumber
        ? `${order.courierName} - ${order.trackingNumber}`
        : "";

    return {
      step,
      title: copy.title,
      description: copy.description,
      mobileSummary: courierLine || copy.mobileSummary,
      mobileMeta: formatProgressStamp(step, order),
    };
  });
}

function SidePanel({ title, children }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OrderProgress({ activeIndex, order }) {
  const prefersReducedMotion = useReducedMotion();
  const steps = useMemo(() => buildProgressSteps(order), [order]);
  const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeStep = steps[Math.min(resolvedActiveIndex, steps.length - 1)] ?? steps[0] ?? null;
  const desktopTimelineRef = useRef(null);
  const stepRefs = useRef([]);
  const [desktopMetrics, setDesktopMetrics] = useState({
    start: 0,
    width: 0,
    progress: 0,
  });

  useEffect(() => {
    const container = desktopTimelineRef.current;
    if (!container) return undefined;

    const updateMetrics = () => {
      const containerRect = container.getBoundingClientRect();
      const centers = stepRefs.current
        .slice(0, steps.length)
        .map((node) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return rect.left - containerRect.left + rect.width / 2;
        })
        .filter((value) => typeof value === "number");

      if (centers.length !== steps.length) {
        return;
      }

      const start = centers[0];
      const end = centers[centers.length - 1];
      const currentNode = stepRefs.current[Math.min(resolvedActiveIndex, centers.length - 1)];
      const current = centers[Math.min(resolvedActiveIndex, centers.length - 1)] ?? start;
      const currentRect = currentNode?.getBoundingClientRect?.();
      const truckLeadOffset = currentRect
        ? Math.max(currentRect.width / 2 + 12, 40)
        : 40;
      const nextMetrics = {
        start,
        width: Math.max(end - start, 0),
        progress: Math.max(current - start - truckLeadOffset, 0),
      };

      setDesktopMetrics((previous) => {
        if (
          Math.abs(previous.start - nextMetrics.start) < 0.5 &&
          Math.abs(previous.width - nextMetrics.width) < 0.5 &&
          Math.abs(previous.progress - nextMetrics.progress) < 0.5
        ) {
          return previous;
        }
        return nextMetrics;
      });
    };

    updateMetrics();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateMetrics);
      return () => window.removeEventListener("resize", updateMetrics);
    }

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);
    stepRefs.current.slice(0, steps.length).forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [resolvedActiveIndex, steps, order?.id]);

  const progressDuration =
    prefersReducedMotion ? 0 : Math.max(1.7, 1.25 + resolvedActiveIndex * 0.35);

  return (
    <section className="relative rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
        Progress
      </p>
      <div className="mt-2 lg:pr-[332px]">
        <h2 className="text-[clamp(1.4rem,2.4vw,1.9rem)] font-semibold tracking-[-0.03em] text-brand-dark">
          Delivery Timeline
        </h2>
        <p className="mt-1.5 max-w-[42ch] text-base leading-7 text-black/62">
          Track where your order is right now.
        </p>
      </div>

      {activeStep ? (
        <div className="mt-3 rounded-[20px] border border-black/8 bg-[#fbf7f0] px-4 py-3 lg:absolute lg:right-5 lg:top-5 lg:mt-0 lg:w-[312px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
            Current update
          </p>
          <p className="mt-1.5 text-sm font-semibold text-brand-dark">{activeStep.title}</p>
          <p className="mt-1 text-sm leading-6 text-black/60">
            {activeStep.description || activeStep.mobileSummary}
          </p>
        </div>
      ) : null}

      <div className="mt-4 rounded-[32px] border border-black/10 bg-[#fffdfa] px-4 py-4 sm:px-5 sm:py-5">
        <div className="hidden lg:block">
          <div ref={desktopTimelineRef} className="relative px-4">
            <div
              className="pointer-events-none absolute top-7 z-0 h-[2px]"
              style={{
                left: desktopMetrics.start ? `${desktopMetrics.start}px` : undefined,
                width: desktopMetrics.width ? `${desktopMetrics.width}px` : undefined,
                opacity: desktopMetrics.width ? 1 : 0,
              }}
            >
              <span className="absolute inset-0 bg-[#e9e2d7]" />
              <m.span
                className="absolute left-0 top-0 h-full bg-[#f5a11a]"
                initial={prefersReducedMotion ? false : { width: 0 }}
                animate={{ width: desktopMetrics.progress }}
                transition={{
                  duration: progressDuration,
                  ease: [0.22, 1, 0.36, 1],
                  delay: prefersReducedMotion ? 0 : 0.16,
                }}
              />
            </div>

            <div className="relative grid grid-cols-5 gap-5">
              {steps.map((step, index) => {
                const complete = resolvedActiveIndex > index;
                const current = resolvedActiveIndex === index;
                const emphasized = complete || current;

                return (
                  <div key={step.step} className="flex flex-col items-center text-center">
                    <m.button
                      type="button"
                      ref={(node) => {
                        stepRefs.current[index] = node;
                      }}
                      whileHover={
                        prefersReducedMotion || current ? undefined : { y: -2, scale: 1.02 }
                      }
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.92, y: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 24 }}
                      className={`relative z-[1] inline-flex h-14 w-14 items-center justify-center rounded-full border text-[1.45rem] font-semibold outline-none ${
                        current
                          ? "border-[#f5a11a] bg-white text-brand-dark shadow-[0_0_0_6px_rgba(245,161,26,0.16)]"
                          : complete
                            ? "border-[#f5a11a] bg-[#f5a11a] text-black"
                            : "border-black/12 bg-white text-brand-dark"
                      }`}
                      aria-label={`${step.title} step`}
                    >
                      {complete ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M6.5 12.5L10.2 16.2L17.8 8.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </m.button>
                    <div className="mt-3.5 flex flex-col items-center text-center">
                      <p
                        className={`max-w-[160px] text-[0.98rem] font-semibold ${
                          emphasized ? "text-brand-dark" : "text-black/46"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p
                        className={`mt-1.5 max-w-[170px] text-xs font-medium ${
                          emphasized ? "text-black/70" : "text-black/42"
                        }`}
                      >
                        {step.mobileMeta}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="relative pl-8">
            <span className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-[#27b24a]/20" />
            {steps.map((step, index) => {
              const complete = resolvedActiveIndex > index;
              const current = resolvedActiveIndex === index;
              const emphasized = complete || current;

              return (
                <div
                  key={step.step}
                  className="relative block w-full pb-6 text-left last:pb-0"
                >
                  <m.button
                    type="button"
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.86 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className={`absolute left-[-27px] top-1 inline-flex h-4 w-4 rounded-full border-2 ${
                      current || complete
                        ? "border-[#27b24a] bg-[#27b24a]"
                        : "border-black/12 bg-white"
                    }`}
                    aria-label={`${step.title} step`}
                  />
                  <div className={emphasized ? "opacity-100" : "opacity-65"}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-brand-dark">{step.title}</p>
                      <p className="text-xs font-medium text-black/46">{step.mobileMeta}</p>
                    </div>
                    {current ? (
                      <p className="mt-2 max-w-[30ch] text-sm leading-6 text-black/60">
                        {step.description || step.mobileSummary}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReplacementPanel({ replacement }) {
  if (!replacement) {
    return null;
  }

  const activeIndex = trackerIndex(REPLACEMENT_FLOW, replacement.status);
  const rejected = replacement.status === "REJECTED";

  return (
    <div
      className={`mt-4 rounded-[22px] border p-4 ${
        rejected ? "border-danger/16 bg-[#fff6f6]" : "border-black/8 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            rejected
              ? "bg-danger/10 text-danger"
              : replacement.isFraudSuspected
                ? "bg-[#fff1d8] text-[#986700]"
                : "bg-[#eef8ee] text-success"
          }`}
        >
          {titleCase(replacement.status)}
        </span>
        <span className="text-xs font-medium text-black/48">
          {formatDateTime(replacement.requestedAt)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {REPLACEMENT_FLOW.map((step, index) => {
          const complete = activeIndex >= index;
          const current = activeIndex === index;

          return (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                current
                  ? "bg-brand-primary text-brand-dark"
                  : complete
                    ? "bg-success/12 text-success"
                    : "bg-[#f4efe6] text-black/42"
              }`}
            >
              {titleCase(step)}
            </span>
          );
        })}
      </div>

      {replacement.pickupStatus ? (
        <p className="mt-3 text-sm text-black/58">Pickup: {replacement.pickupStatus}</p>
      ) : null}
      {replacement.adminNote ? (
        <p className="mt-2 text-sm text-black/58">Admin note: {replacement.adminNote}</p>
      ) : null}
    </div>
  );
}

function OrderPoliciesPanel({
  readOnly,
  orderStatus,
  liveCanCancel,
  canOpenReplacementModal,
  isCancelling,
  cancellationHelperText,
  replacementHelperText,
  cancelError,
  onOpenCancellationInfo,
  onOpenReplacementInfo,
  onOpenSupportInfo,
  onOpenCancelConfirm,
  onOpenReplacement,
}) {
  const cancellationActionLabel = readOnly
    ? ""
    : orderStatus === "CANCELLED"
      ? "Order Cancelled"
      : "Cancel Order";

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
        Order Policies
      </p>

      <div className="mt-3 space-y-2.5">
        <div className="rounded-[20px] border border-black/8 bg-[#fbf7f0] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 sm:flex-1 sm:pr-4">
              <button
                type="button"
                onClick={onOpenCancellationInfo}
                className="text-left text-base font-semibold text-brand-dark transition hover:underline hover:underline-offset-4"
              >
                Cancellation Policy
              </button>
              <p className="mt-1 text-sm leading-6 text-black/58">
                Cancel within 24 hours of placing the order.
              </p>
              <p className="mt-1 text-xs font-medium text-black/44">{cancellationHelperText}</p>
            </div>

            {cancellationActionLabel ? (
              <button
                type="button"
                onClick={onOpenCancelConfirm}
                disabled={!liveCanCancel || isCancelling || orderStatus === "CANCELLED"}
                className="inline-flex shrink-0 whitespace-nowrap text-left text-sm font-semibold text-brand-dark transition hover:underline hover:underline-offset-4 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {cancellationActionLabel}
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[20px] border border-black/8 bg-[#fbf7f0] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onOpenReplacementInfo}
                className="text-left text-base font-semibold text-brand-dark transition hover:underline hover:underline-offset-4"
              >
                Replacement Policy
              </button>
              <p className="mt-1 text-sm leading-6 text-black/58 sm:whitespace-nowrap">
                Request a replacement within 3 days of delivery for damaged items.
              </p>
              <p className="mt-1 text-xs font-medium text-black/44">{replacementHelperText}</p>
            </div>

            {!readOnly ? (
              <button
                type="button"
                onClick={onOpenReplacement}
                disabled={!canOpenReplacementModal}
                className="inline-flex shrink-0 whitespace-nowrap text-left text-sm font-semibold text-brand-dark transition hover:underline hover:underline-offset-4 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Replace Order
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3.5 border-t border-black/8 pt-3.5">
        <button
          type="button"
          onClick={onOpenSupportInfo}
          className="text-left text-base font-semibold text-brand-dark transition hover:underline hover:underline-offset-4"
        >
          Need help?
        </button>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold">
          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="text-brand-dark transition hover:underline hover:underline-offset-4"
          >
            WhatsApp
          </a>
          <span className="text-black/28">|</span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-brand-dark transition hover:underline hover:underline-offset-4"
          >
            Email
          </a>
        </div>
      </div>

      {cancelError ? <p className="mt-4 text-sm text-danger">{cancelError}</p> : null}
    </section>
  );
}

function OrderDetail({ readOnly = false }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const email = readOnly ? searchParams.get("email")?.trim().toLowerCase() ?? "" : "";
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [replacementItem, setReplacementItem] = useState(null);
  const [isCancellationInfoOpen, setIsCancellationInfoOpen] = useState(false);
  const [isReplacementInfoOpen, setIsReplacementInfoOpen] = useState(false);
  const [isSupportInfoOpen, setIsSupportInfoOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCancelSuccessOpen, setIsCancelSuccessOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [selectedReviewItemId, setSelectedReviewItemId] = useState("");
  const [reviewDraft, setReviewDraft] = useState(() => buildReviewDraft());
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [isLoadingReviewSummary, setIsLoadingReviewSummary] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const hasHandledRateParamRef = useRef(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError("");

      if (readOnly && !email) {
        setError("Enter your billing email on the tracking page to view this order.");
        setIsLoading(false);
        return;
      }

      try {
        const response = readOnly
          ? await orderApi.getTrackedOrder(id, email)
          : await orderApi.getOrder(id);
        setOrder(response);
      } catch (orderError) {
        setError(formatApiError(orderError));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [email, id, readOnly]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!order?.trackingNumber || ["DELIVERED", "CANCELLED"].includes(order.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const response = readOnly
          ? await orderApi.getTrackedOrder(id, email)
          : await orderApi.getOrder(id);
        setOrder(response);
      } catch {
        // Preserve the current snapshot when polling fails.
      }
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [email, id, order?.status, order?.trackingNumber, readOnly]);

  useEffect(() => {
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    const preferredName = user?.name?.trim() || order?.shippingName || "";
    const preferredEmail =
      user?.email?.trim()?.toLowerCase() || order?.contactEmail?.trim()?.toLowerCase() || "";

    setReviewDraft(buildReviewDraft(preferredName, preferredEmail));

    if (!orderItems.length) {
      setSelectedReviewItemId("");
      return;
    }

    setSelectedReviewItemId((current) =>
      current && orderItems.some((item) => String(item.id) === String(current))
        ? current
        : String(orderItems[0].id),
    );
  }, [order?.id, order?.items, order?.shippingName, order?.contactEmail, user?.name, user?.email]);

  useEffect(() => {
    if (
      readOnly ||
      hasHandledRateParamRef.current ||
      searchParams.get("rate") !== "true" ||
      order?.status !== "DELIVERED" ||
      !Array.isArray(order?.items) ||
      order.items.length === 0
    ) {
      return;
    }

    hasHandledRateParamRef.current = true;
    setIsRateModalOpen(true);
  }, [order?.id, order?.items, order?.status, readOnly, searchParams]);

  useEffect(() => {
    let cancelled = false;
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    const selectedItem =
      orderItems.find((item) => String(item.id) === String(selectedReviewItemId)) ??
      orderItems[0] ??
      null;

    if (!isRateModalOpen || !selectedItem?.productId) {
      if (!isRateModalOpen) {
        setReviewSummary(null);
        setReviewError("");
        setReviewSuccess("");
      }
      return undefined;
    }

    async function loadReviewSummary() {
      const preferredName = user?.name?.trim() || order?.shippingName || "";
      const preferredEmail =
        user?.email?.trim()?.toLowerCase() || order?.contactEmail?.trim()?.toLowerCase() || "";

      setIsLoadingReviewSummary(true);
      setReviewError("");
      setReviewSuccess("");

      try {
        const summary = await catalogApi.getProductReviews(selectedItem.productId);
        if (cancelled) {
          return;
        }

        setReviewSummary(summary);

        if (summary?.currentUserReview) {
          setReviewDraft(
            buildReviewDraft(
              summary.currentUserReview.reviewerName || preferredName,
              preferredEmail,
              Number(summary.currentUserReview.rating ?? 5),
              summary.currentUserReview.message || "",
            ),
          );
          return;
        }

        setReviewDraft(buildReviewDraft(preferredName, preferredEmail));
      } catch (nextError) {
        if (!cancelled) {
          setReviewSummary(null);
          setReviewError(formatApiError(nextError));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReviewSummary(false);
        }
      }
    }

    loadReviewSummary();

    return () => {
      cancelled = true;
    };
  }, [
    isRateModalOpen,
    order?.contactEmail,
    order?.items,
    order?.shippingName,
    selectedReviewItemId,
    user?.email,
    user?.name,
  ]);

  if (isLoading) {
    return <OrderHistorySkeleton />;
  }

  if (error || !order) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Order unavailable"
          message={error || "That order could not be loaded."}
          action={
            <Link
              to={readOnly ? "/track" : "/orders"}
              className="btn btn-primary mt-6"
            >
              {readOnly ? "Back to tracking" : "Back to orders"}
            </Link>
          }
        />
      </section>
    );
  }

  const motion = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      };

  const meta = statusMeta(order.status);
  const activeIndex = order.status === "CANCELLED" ? -1 : trackerIndex(ORDER_FLOW, order.status);
  const liveCanCancel = Boolean(
    order.canCancel &&
      order.cancelDeadline &&
      new Date(order.cancelDeadline).getTime() > currentTime,
  );
  const items = Array.isArray(order.items) ? order.items : [];
  const replacements = order.replacements ?? {};
  const deliveryRange = formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd);
  const paymentProviderLabel = formatPaymentProviderLabel(order.paymentProvider);
  const paymentStatusLabel = formatPaymentStatusLabel(order.paymentStatus, order.paymentProvider);
  const normalizedPaymentProviderLabel = paymentProviderLabel.trim().toLowerCase();
  const normalizedPaymentStatusLabel = paymentStatusLabel.trim().toLowerCase();
  const showPaymentStatusSummary =
    Boolean(paymentStatusLabel) &&
    normalizedPaymentProviderLabel !== normalizedPaymentStatusLabel &&
    !(
      normalizedPaymentProviderLabel === "cash on delivery" &&
      normalizedPaymentStatusLabel === "pay on delivery"
    );
  const trackingId = trackingReference(order);
  const replaceableItems = items.filter((item) =>
    canRequestReplacement(order, itemReplacement(replacements, item.id), readOnly),
  );
  const reviewableItems = items.filter((item) => Boolean(item.productId));
  const selectedReviewItem =
    reviewableItems.find((item) => String(item.id) === String(selectedReviewItemId)) ??
    reviewableItems[0] ??
    null;
  const currentUserReview = reviewSummary?.currentUserReview ?? null;
  const canRateOrder = !readOnly && order.status === "DELIVERED" && reviewableItems.length > 0;
  const cancellationHelperText = readOnly
    ? "Manage cancellations after sign-in."
    : liveCanCancel
      ? `${formatTimeRemaining(order.cancelDeadline, currentTime)} remaining.`
      : order.status === "CANCELLED"
        ? "Order already cancelled."
        : "24-hour cancellation window closed.";
  const replacementHelperText = readOnly
    ? "Manage replacements after sign-in."
    : replaceableItems.length > 1
      ? "Choose the eligible item inside the request form."
      : replaceableItems.length === 1
        ? "Available for one eligible item."
        : order.canReplace
          ? "One-time replacement already used."
          : order.status === "DELIVERED"
            ? "3-day replacement window closed."
            : "Replacement opens after delivery.";
  const canOpenReplacementModal = !readOnly && replaceableItems.length > 0;

  async function refreshOrder() {
    const response = readOnly
      ? await orderApi.getTrackedOrder(id, email)
      : await orderApi.getOrder(id);
    setOrder(response);
  }

  async function handleDownloadInvoice() {
    if (!order.invoiceNumber) return;

    setIsDownloadingInvoice(true);
    setDownloadError("");

    try {
      const blob = readOnly
        ? await orderApi.downloadTrackedInvoice(order.id, email)
        : await orderApi.downloadInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (invoiceError) {
      setDownloadError(formatApiError(invoiceError));
    } finally {
      setIsDownloadingInvoice(false);
    }
  }

  function handleOpenReplacement() {
    if (!canOpenReplacementModal) {
      return;
    }

    setReplacementItem(replaceableItems[0]);
  }

  function handleOpenRateModal() {
    if (!canRateOrder) {
      return;
    }

    setReviewError("");
    setReviewSuccess("");
    setIsRateModalOpen(true);
  }

  function handleCloseRateModal() {
    setIsRateModalOpen(false);
    setReviewError("");
    setReviewSuccess("");
  }

  function handleOpenCancelConfirm() {
    if (readOnly || !liveCanCancel || isCancelling) {
      return;
    }

    setIsCancelConfirmOpen(true);
  }

  async function handleConfirmCancelOrder() {
    if (readOnly || !liveCanCancel || isCancelling) return;

    setIsCancelling(true);
    setCancelError("");

    try {
      const response = await orderApi.cancelOrder(order.id, {
        reason: "Customer requested cancellation",
      });
      setOrder(response);
      setIsCancelConfirmOpen(false);
      setIsCancelSuccessOpen(true);
    } catch (nextError) {
      setCancelError(formatApiError(nextError));
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleSubmitReview() {
    if (
      !selectedReviewItem?.productId ||
      isSubmittingReview ||
      Boolean(currentUserReview)
    ) {
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const summary = await catalogApi.createProductReview(String(selectedReviewItem.productId), {
        reviewerName: reviewDraft.reviewerName.trim(),
        reviewerEmail: reviewDraft.reviewerEmail.trim().toLowerCase(),
        rating: Number(reviewDraft.rating),
        message: reviewDraft.message.trim(),
      });

      setReviewSummary(summary);
      setReviewSuccess("Thanks for sharing your review.");

      if (summary?.currentUserReview) {
        setReviewDraft(
          buildReviewDraft(
            summary.currentUserReview.reviewerName || reviewDraft.reviewerName.trim(),
            reviewDraft.reviewerEmail.trim().toLowerCase(),
            Number(summary.currentUserReview.rating ?? reviewDraft.rating),
            summary.currentUserReview.message || reviewDraft.message.trim(),
          ),
        );
      }
    } catch (nextError) {
      setReviewError(formatApiError(nextError));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="container-shell">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={readOnly ? "/track" : "/orders"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-black/58 transition hover:text-black hover:underline hover:underline-offset-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
            >
              <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {readOnly ? "Back to tracking" : "Back to orders"}
          </Link>

          {readOnly ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">
              <span className="h-2 w-2 rounded-full bg-brand-primary" />
              Read-only tracking view
            </span>
          ) : null}
        </div>

        <m.div {...motion} className="mt-4 space-y-3">
          <section className="rounded-[32px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.pill}`.trim()}
                  >
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                    {meta.label}
                  </span>
                  <span className="text-sm font-medium text-black/40">Order #{order.id}</span>
                </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                      Tracking ID
                    </p>
                    <h1 className="mt-2 font-display text-[clamp(1.75rem,3.4vw,2.7rem)] font-semibold leading-none text-brand-dark">
                      {trackingId}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-black/58">
                      Order #{order.id}
                    </p>
                  </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {order.invoiceNumber ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                  >
                    {isDownloadingInvoice ? "Preparing invoice..." : "Invoice"}
                  </button>
                ) : null}

                {canRateOrder ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-black/[0.03]"
                    onClick={handleOpenRateModal}
                  >
                    Rate Order
                  </button>
                ) : null}

                {readOnly ? (
                  <Link
                    to="/track"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-[#f0ad15]"
                  >
                    Track another order
                  </Link>
                ) : order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-dark transition hover:bg-[#f0ad15]"
                  >
                    Track order
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 border-t border-black/8 pt-3.5 sm:grid-cols-3">
              <div className="rounded-[20px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Order date
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-dark">{formatDate(order.createdAt)}</p>
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Estimated delivery
                </p>
                <p className={`mt-1 text-sm font-semibold ${meta.accent}`.trim()}>{deliveryRange}</p>
              </div>
              <div className="rounded-[20px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Payment
                </p>
                <p className="mt-1 text-sm font-semibold text-brand-dark">{paymentProviderLabel}</p>
                {showPaymentStatusSummary ? (
                  <p className="mt-0.5 text-xs text-black/48">{paymentStatusLabel}</p>
                ) : null}
              </div>
            </div>

            {downloadError ? <p className="mt-4 text-sm text-danger">{downloadError}</p> : null}
          </section>

          <OrderProgress activeIndex={activeIndex} order={order} />

          <div className="grid gap-x-3 gap-y-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] xl:items-start">
            <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">Order items</p>
                    <p className="mt-2 text-lg font-semibold text-brand-dark">
                      Items in this order
                    </p>
                  </div>
                  <span className="text-sm font-medium text-black/48">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-6 divide-y divide-black/8">
                  {items.map((item) => {
                    const replacement = itemReplacement(replacements, item.id);
                    const imageProps = item.imageUrl
                      ? getResponsiveImageProps(item.imageUrl, {
                          widths: [160, 240, 320],
                          quality: 68,
                          sizes: "96px",
                        })
                      : null;

                    return (
                      <article key={item.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-[#f5efe4]">
                              {imageProps ? (
                                <img
                                  src={imageProps.src}
                                  srcSet={imageProps.srcSet}
                                  sizes={imageProps.sizes}
                                  alt={item.productName}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(event) =>
                                    applyImageFallback(event, fallbackProductImage)
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.14em] text-black/45">
                                  Candle
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-lg font-semibold text-brand-dark">
                                {item.productName}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-black/56">
                                <span>Quantity {item.quantity}</span>
                                <span>{formatCurrency(item.price)} each</span>
                              </div>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xl font-semibold text-brand-dark">
                              {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                            </p>
                          </div>
                        </div>

                        <ReplacementPanel replacement={replacement} />
                      </article>
                    );
                  })}
                </div>
              </section>

              <SidePanel title="Shipping address">
                <p className="text-lg font-semibold text-brand-dark">{order.shippingName}</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-black/62">
                  <p>
                    {[
                      order.addressLine1,
                      order.addressLine2,
                      order.city,
                      order.state,
                      order.postalCode,
                      order.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {order.phone ? <p>{order.phone}</p> : null}
                  {order.contactEmail ? <p>{order.contactEmail}</p> : null}
                </div>
              </SidePanel>

              <OrderPoliciesPanel
                readOnly={readOnly}
                orderStatus={order.status}
                liveCanCancel={liveCanCancel}
                canOpenReplacementModal={canOpenReplacementModal}
                isCancelling={isCancelling}
                cancellationHelperText={cancellationHelperText}
                replacementHelperText={replacementHelperText}
                cancelError={cancelError}
                onOpenCancellationInfo={() => setIsCancellationInfoOpen(true)}
                onOpenReplacementInfo={() => setIsReplacementInfoOpen(true)}
                onOpenSupportInfo={() => setIsSupportInfoOpen(true)}
                onOpenCancelConfirm={handleOpenCancelConfirm}
                onOpenReplacement={handleOpenReplacement}
              />

              <SidePanel title="Order Summary">
                <div className="space-y-3">
                  <SummaryRow label="Item Total" value={formatCurrency(order.subtotalAmount)} />
                  <SummaryRow
                    label="Total Discounts"
                    value={formatCurrency(order.discountAmount)}
                    valueClassName="text-success"
                  />
                  <SummaryRow label="Shipping" value="Free" />
                  <SummaryRow label="Payment" value={paymentProviderLabel} />
                  <div className="border-t border-black/8 pt-3">
                    <SummaryRow
                      label="Total"
                      value={formatCurrency(order.totalAmount)}
                      valueClassName="text-base"
                    />
                  </div>
                </div>
              </SidePanel>
          </div>
        </m.div>
      </div>

      <Modal
        isOpen={isRateModalOpen}
        onClose={handleCloseRateModal}
        kicker="Order feedback"
        title="Rate your order"
        description="Share your feedback in a quick popup instead of the main order page."
        maxWidthClass="max-w-[640px]"
      >
        <div className="space-y-4">
          {reviewableItems.length > 1 ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                Select item
              </label>
              <CandleSelectControl
                value={selectedReviewItemId}
                onChange={(nextValue) => setSelectedReviewItemId(String(nextValue))}
                options={reviewableItems.map((item) => ({
                  value: String(item.id),
                  label: item.productName,
                }))}
                placeholder="Select item"
                buttonClassName="!h-11 !rounded-2xl"
              />
            </div>
          ) : null}

          {selectedReviewItem ? (
            <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                Selected item
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-[#f5efe4]">
                  {selectedReviewItem.imageUrl ? (
                    <img
                      src={selectedReviewItem.imageUrl}
                      alt={selectedReviewItem.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-brand-dark">{selectedReviewItem.productName}</p>
                  <p className="mt-1 text-sm text-black/56">
                    Quantity {selectedReviewItem.quantity} • {formatCurrency(selectedReviewItem.price)} each
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                Name
              </label>
              <input
                value={reviewDraft.reviewerName}
                readOnly
                className="h-11 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 text-sm text-brand-dark outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
                Email
              </label>
              <input
                value={reviewDraft.reviewerEmail}
                readOnly
                className="h-11 rounded-2xl border border-black/10 bg-[#f8f5ef] px-4 text-sm text-brand-dark outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
              Rating
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((ratingValue) => (
                <button
                  key={ratingValue}
                  type="button"
                  disabled={Boolean(currentUserReview) || isLoadingReviewSummary}
                  onClick={() =>
                    setReviewDraft((current) => ({
                      ...current,
                      rating: ratingValue,
                    }))
                  }
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    Number(reviewDraft.rating) === ratingValue
                      ? "border-[#f0ad15] bg-[#fff5df] text-brand-dark"
                      : "border-black/10 bg-white text-brand-dark hover:border-black/20"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <span aria-hidden="true">★</span>
                  {ratingValue}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-black/42">
              Review
            </label>
            <textarea
              rows="5"
              value={reviewDraft.message}
              onChange={(event) =>
                setReviewDraft((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              placeholder="Share your experience with the fragrance, finish, packaging, and burn quality..."
              disabled={Boolean(currentUserReview) || isLoadingReviewSummary}
              className="min-h-[140px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm leading-7 text-brand-dark outline-none transition placeholder:text-black/38 focus:border-black/20 disabled:bg-[#f8f5ef]"
            />
          </div>

          {isLoadingReviewSummary ? (
            <p className="text-sm text-black/58">Loading your saved review...</p>
          ) : null}
          {reviewError ? <p className="text-sm text-danger">{reviewError}</p> : null}
          {reviewSuccess ? <p className="text-sm text-success">{reviewSuccess}</p> : null}
          {currentUserReview ? (
            <p className="text-sm text-black/58">
              You have already reviewed this product. Your saved review is shown above.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="checkout-action-secondary"
              onClick={handleCloseRateModal}
            >
              Close
            </button>
            <button
              type="button"
              className="checkout-action-primary"
              onClick={handleSubmitReview}
              disabled={
                isSubmittingReview ||
                isLoadingReviewSummary ||
                Boolean(currentUserReview) ||
                !reviewDraft.message.trim()
              }
            >
              {currentUserReview
                ? "Review Posted"
                : isSubmittingReview
                  ? "Submitting..."
                  : "Submit Review"}
            </button>
          </div>
        </div>
      </Modal>

      <ReplaceModal
        isOpen={Boolean(replacementItem)}
        onClose={() => setReplacementItem(null)}
        orderId={order.id}
        item={replacementItem}
        items={replaceableItems}
        onSuccess={refreshOrder}
      />

        <Modal
          isOpen={isCancellationInfoOpen}
          onClose={() => setIsCancellationInfoOpen(false)}
          kicker="Order policy"
          title="Cancellation Policy"
        description=""
        maxWidthClass="max-w-[620px]"
      >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-black/8 bg-[#fff8ec] px-5 py-4">
              <p className="text-sm leading-7 text-black/62">
                {CANCELLATION_POLICY_COPY}
              </p>
            </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="checkout-action-secondary"
              onClick={() => setIsCancellationInfoOpen(false)}
            >
              Close
            </button>
            {!readOnly && liveCanCancel ? (
              <button
                type="button"
                className="checkout-action-primary"
                onClick={() => {
                  setIsCancellationInfoOpen(false);
                  setIsCancelConfirmOpen(true);
                }}
              >
                Cancel Order
              </button>
            ) : null}
          </div>
        </div>
      </Modal>

        <Modal
          isOpen={isReplacementInfoOpen}
          onClose={() => setIsReplacementInfoOpen(false)}
          kicker="Order policy"
          title="Replacement Policy"
        description=""
        maxWidthClass="max-w-[700px]"
      >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-black/8 bg-[#fff8ec] px-5 py-4">
              <p className="text-sm leading-7 text-black/62">
                {REPLACEMENT_POLICY_COPY}
              </p>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Share proof (image or video) on our WhatsApp number or email while raising the
              request. Only one-time replacement is allowed.
            </p>
          </div>

          <div className="rounded-[24px] border border-black/8 bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
              Share proof with CandleOra
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/12 bg-[#fbf7f0] px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f6efe3]"
              >
                WhatsApp {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-black/[0.03]"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="checkout-action-secondary"
              onClick={() => setIsReplacementInfoOpen(false)}
            >
              Close
            </button>
            {canOpenReplacementModal ? (
              <button
                type="button"
                className="checkout-action-primary"
                onClick={() => {
                  setIsReplacementInfoOpen(false);
                  handleOpenReplacement();
                }}
              >
                Replace Order
              </button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isSupportInfoOpen}
        onClose={() => setIsSupportInfoOpen(false)}
        kicker="Order support"
        title="Contact Support"
        description=""
        maxWidthClass="max-w-[620px]"
      >
        <div className="space-y-4">
          <div className="rounded-[24px] border border-black/8 bg-[#fff8ec] px-5 py-4">
            <p className="text-sm leading-7 text-black/62">
              Need help with delivery, payment, or a damaged order? Reach CandleOra directly on
              WhatsApp or email.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-black/12 bg-[#fbf7f0] px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-[#f6efe3]"
            >
              WhatsApp {SUPPORT_PHONE_DISPLAY}
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-black/[0.03]"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        kicker="Confirm cancellation"
        title="Are you sure you want to cancel this order?"
        description=""
        maxWidthClass="max-w-[560px]"
        bodyScrollable={false}
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[#f2d29a] bg-[#fff8ec] px-6 py-8 text-center">
            <p className="text-base leading-8 text-black/68">
              This order will be cancelled right away and the update will reflect on your account.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="checkout-action-secondary"
              onClick={() => setIsCancelConfirmOpen(false)}
            >
              No
            </button>
            <button
              type="button"
              className="checkout-action-primary"
              onClick={handleConfirmCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Yes"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCancelSuccessOpen}
        onClose={() => setIsCancelSuccessOpen(false)}
        kicker="Order update"
        title="You have successfully cancelled your order."
        description=""
        maxWidthClass="max-w-[560px]"
        bodyScrollable={false}
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[#f2d29a] bg-[#fff8ec] px-6 py-8 text-center">
            <p className="text-base leading-8 text-black/68">
              Your order status has been updated and the cancellation is now confirmed.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className="checkout-action-primary"
              onClick={() => setIsCancelSuccessOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

export default OrderDetail;
