import { useEffect, useMemo, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.jpg";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDateRange,
  formatTimeRemaining,
  titleCase,
} from "../utils/format";

const orderFlow = [
  {
    key: "PENDING_PAYMENT",
    label: "Awaiting payment",
    copy: "We are waiting for payment confirmation before the order moves into production.",
  },
  {
    key: "CONFIRMED",
    label: "Confirmed",
    copy: "The order is verified and queued for packing inside the CandleOra studio.",
  },
  {
    key: "SHIPPED",
    label: "Shipped",
    copy: "Your parcel has left CandleOra and is moving through the carrier network.",
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    copy: "The final handoff is in progress and the package should arrive soon.",
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    copy: "The package has been delivered and the order record is now complete.",
  },
];

const actionButtonClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

function formatPaymentProviderLabel(provider) {
  const normalized = String(provider ?? "").toUpperCase();

  if (normalized === "COD") {
    return "Cash on delivery";
  }

  return titleCase(normalized);
}

function formatPaymentStatusLabel(status, provider) {
  const normalizedStatus = String(status ?? "").toUpperCase();
  const normalizedProvider = String(provider ?? "").toUpperCase();

  if (normalizedStatus === "COD_PENDING" && normalizedProvider === "COD") {
    return "Pay on delivery";
  }

  if (normalizedStatus === "PENDING") {
    return "Awaiting payment";
  }

  if (normalizedStatus === "PAID") {
    return "Paid successfully";
  }

  if (normalizedStatus === "FAILED") {
    return "Payment issue";
  }

  return titleCase(normalizedStatus);
}

function getOrderStatusMeta(status) {
  const normalized = String(status ?? "").toUpperCase();

  switch (normalized) {
    case "PENDING_PAYMENT":
      return {
        label: "Awaiting payment",
        headline: "Payment confirmation is still in progress.",
        summary:
          "This order stays in one live record while payment, delivery, and support updates are collected.",
        pillClass: "border-brand-primary/20 bg-[#fff8e7] text-[#9a6200]",
        accentClass: "bg-[#fff8e7]",
        iconClass: "bg-brand-primary/18 text-brand-dark",
      };
    case "SHIPPED":
      return {
        label: "Shipped",
        headline: "Your order has left CandleOra.",
        summary:
          "Tracking, delivery timing, and payment references are organized below so nothing gets lost between screens.",
        pillClass: "border-black/12 bg-black/[0.04] text-brand-dark",
        accentClass: "bg-[#f8f6f1]",
        iconClass: "bg-black/8 text-brand-dark",
      };
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for delivery",
        headline: "The final delivery handoff is underway.",
        summary:
          "Everything needed for this order, from delivery details to support actions, is grouped here for quick access.",
        pillClass: "border-success/18 bg-[#eef8ee] text-success",
        accentClass: "bg-[#f7fbf7]",
        iconClass: "bg-success/14 text-success",
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        headline: "This order was delivered successfully.",
        summary:
          "The invoice, payment ledger, delivery record, and post-delivery support details remain available here anytime.",
        pillClass: "border-success/18 bg-[#eef8ee] text-success",
        accentClass: "bg-[#f7fbf7]",
        iconClass: "bg-success/14 text-success",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        headline: "This order has been cancelled.",
        summary:
          "The delivery attempt has stopped, but the full payment and cancellation history remains available for reference.",
        pillClass: "border-danger/18 bg-[#fff3f3] text-danger",
        accentClass: "bg-[#fff7f7]",
        iconClass: "bg-danger/12 text-danger",
      };
    case "CONFIRMED":
    default:
      return {
        label: "Confirmed",
        headline: "Your order is active and moving.",
        summary:
          "Track milestones, review the item ledger, and manage delivery or payment actions from this one order canvas.",
        pillClass: "border-brand-primary/20 bg-[#fff8e7] text-[#9a6200]",
        accentClass: "bg-[#fffdf7]",
        iconClass: "bg-brand-primary/18 text-brand-dark",
      };
  }
}

function getTrackingReference(order) {
  return String(
    order?.gatewayOrderId || order?.gatewayPaymentId || order?.invoiceNumber || order?.id || "",
  );
}

function DetailRow({ label, value, valueClassName = "" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-black/52">{label}</span>
      <span className={`text-right text-sm font-medium text-brand-dark ${valueClassName}`.trim()}>
        {value}
      </span>
    </div>
  );
}

function StepMarker({ completed, current, index }) {
  if (completed && !current) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-brand-dark">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7.5 12.5L10.5 15.5L16.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
        current ? "bg-brand-primary text-brand-dark" : "bg-black/8 text-black/42"
      }`}
    >
      {index + 1}
    </span>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError("");
    setDownloadError("");
    setCancelError("");

    orderApi
      .getOrder(id)
      .then((response) => {
        if (isMounted) {
          setOrder(response);
        }
      })
      .catch((orderError) => {
        if (isMounted) {
          setError(formatApiError(orderError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeStep = useMemo(() => {
    if (!order?.status || order.status === "CANCELLED") {
      return -1;
    }

    return orderFlow.findIndex((step) => step.key === order.status);
  }, [order?.status]);

  const liveCanCancel = useMemo(() => {
    if (!order?.canCancel || !order?.cancelDeadline) {
      return false;
    }

    return new Date(order.cancelDeadline).getTime() > currentTime;
  }, [currentTime, order?.canCancel, order?.cancelDeadline]);

  const cancelTimeRemaining = useMemo(
    () => formatTimeRemaining(order?.cancelDeadline, currentTime),
    [currentTime, order?.cancelDeadline],
  );

  const handleDownloadInvoice = async () => {
    if (!order?.invoiceNumber) {
      return;
    }

    setIsDownloadingInvoice(true);
    setDownloadError("");

    try {
      const blob = await orderApi.downloadInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadInvoiceError) {
      setDownloadError(formatApiError(downloadInvoiceError));
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!liveCanCancel || isCancelling) {
      return;
    }

    const confirmed = window.confirm(
      "Cancel this order now? Online cancellations are available within 24 hours of placing the order."
    );
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setCancelError("");

    try {
      const response = await orderApi.cancelOrder(order.id, {
        reason: "Customer requested cancellation",
      });
      setOrder(response);
    } catch (cancelOrderError) {
      setCancelError(formatApiError(cancelOrderError));
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading order" message="Fetching your CandleOra order details." />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Order unavailable"
          message={error || "That order could not be loaded."}
          action={
            <Link
              to="/orders"
              className="btn btn-primary mt-6"
            >
              Back to orders
            </Link>
          }
        />
      </section>
    );
  }

  const surfaceMotion = prefersReducedMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      };

  const statusMeta = getOrderStatusMeta(order.status);
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const itemCount = orderItems.reduce((count, item) => count + Number(item.quantity ?? 0), 0);
  const trackingReference = getTrackingReference(order);
  const paymentProviderLabel = formatPaymentProviderLabel(order.paymentProvider);
  const paymentStatusLabel = formatPaymentStatusLabel(order.paymentStatus, order.paymentProvider);
  const deliveryRange = formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd);
  const locationSummary =
    order.locationLabel || [order.city, order.state, order.country].filter(Boolean).join(", ");
  const addressSummary = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.state,
    order.postalCode,
    order.country,
  ]
    .filter(Boolean)
    .join(", ");
  const currentStep = activeStep >= 0 ? orderFlow[activeStep] : null;
  const nextStep =
    activeStep >= 0 && activeStep < orderFlow.length - 1 ? orderFlow[activeStep + 1] : null;
  const progressPercent =
    activeStep >= 0 ? (activeStep / Math.max(orderFlow.length - 1, 1)) * 100 : 0;
  const reachedStepCount = activeStep >= 0 ? activeStep + 1 : 0;
  const orderSummary =
    order.status === "CANCELLED"
      ? `Cancelled on ${formatDateTime(order.cancelledAt || order.createdAt)}.`
      : `Placed on ${formatDate(order.createdAt)} with ${paymentStatusLabel.toLowerCase()} recorded for this order.`;
  const cancellationSummary =
    order.status === "CANCELLED"
      ? order.cancellationReason || "This order was cancelled before delivery."
      : liveCanCancel
        ? `Cancellation available until ${formatDateTime(order.cancelDeadline)}.`
        : "The 24-hour online cancellation window has ended for this order.";
  const showCancelActions = order.status !== "CANCELLED" && liveCanCancel;

  return (
    <section className="bg-white py-8 sm:py-10">
      <div className="container-shell">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-black/58 transition hover:text-black"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to orders
        </Link>

        <m.div
          {...surfaceMotion}
          className="mt-5 overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
        >
          <div className="grid xl:grid-cols-[minmax(0,1.16fr)_340px]">
            <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusMeta.pillClass}`.trim()}
              >
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                {statusMeta.label}
              </span>

              <div className="mt-6 max-w-3xl space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                    Order detail
                  </p>
                  <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,4.4rem)] leading-[0.95] tracking-[-0.045em] text-brand-dark">
                    Order #{order.id}
                  </h1>
                </div>

                <div className="max-w-2xl space-y-3">
                  <p className="text-lg font-semibold leading-8 text-brand-dark">{statusMeta.headline}</p>
                  <p className="text-sm leading-7 text-black/62 sm:text-base">{statusMeta.summary}</p>
                  <p className="text-sm leading-7 text-black/52">{orderSummary}</p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
                <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  {paymentStatusLabel}
                </span>
                {order.invoiceNumber ? (
                  <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    Invoice {order.invoiceNumber}
                  </span>
                ) : null}
                {order.couponCode ? (
                  <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                    Coupon {order.couponCode}
                  </span>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {order.invoiceNumber ? (
                  <button
                    type="button"
                    className={`${actionButtonClass} border border-[#e8b13d] bg-brand-primary text-brand-dark hover:bg-[#f0ad15]`}
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                  >
                    {isDownloadingInvoice ? "Preparing invoice..." : "Download invoice"}
                  </button>
                ) : null}

                <Link
                  to="/shop"
                  className={`${actionButtonClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
                >
                  Continue shopping
                </Link>

                <Link
                  to="/orders"
                  className={`${actionButtonClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
                >
                  View all orders
                </Link>
              </div>

              {downloadError ? <p className="mt-4 text-sm text-danger">{downloadError}</p> : null}
            </div>

            <aside className="border-t border-black/8 bg-white px-6 py-8 sm:px-8 xl:border-l xl:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                Order snapshot
              </p>

              <div className="mt-4 rounded-[28px] border border-black/8 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black/54">Total paid</p>
                    <p className="mt-3 font-display text-[2.75rem] leading-none text-brand-dark">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${statusMeta.iconClass}`.trim()}>
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 7H19V17H5Z" />
                      <path d="M5 10H19" />
                      <path d="M9 14H10" strokeLinecap="round" />
                      <path d="M14 14H16" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <DetailRow label="Placed" value={formatDateTime(order.createdAt)} />
                  <DetailRow label="Payment" value={paymentStatusLabel} />
                  <DetailRow label="Provider" value={paymentProviderLabel} />
                  <DetailRow label="Delivery" value={deliveryRange} />
                  <DetailRow label="Reference" value={trackingReference} />
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  What happens now
                </p>
                <p className="mt-3 text-base font-semibold text-brand-dark">{currentStep?.label || statusMeta.label}</p>
                <p className="mt-2 text-sm leading-7 text-black/62">
                  {order.status === "CANCELLED"
                    ? cancellationSummary
                    : currentStep?.copy || "This order will continue updating here as each milestone changes."}
                </p>
                {showCancelActions ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-danger/80">
                    {cancelTimeRemaining}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>

          <div className="border-t border-black/8 bg-white px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                  Progress
                </p>
                <p className="mt-2 text-lg font-semibold text-brand-dark">Delivery and fulfillment timeline</p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-black/58">
                  The current stage is highlighted so you can see exactly where this order sits in the CandleOra fulfillment flow.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  Tracking reference {trackingReference}
                </span>
                <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  Estimated {deliveryRange}
                </span>
              </div>
            </div>

            {order.status === "CANCELLED" ? (
              <div className="mt-6 rounded-[28px] border border-danger/18 bg-[#fff7f7] px-5 py-5 sm:px-6">
                <p className="text-lg font-semibold text-brand-dark">This order was cancelled.</p>
                <p className="mt-2 text-sm leading-7 text-black/62">
                  {cancellationSummary}
                  {order.cancelledAt ? ` Cancelled on ${formatDateTime(order.cancelledAt)}.` : ""}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="hidden rounded-[28px] border border-black/8 bg-white px-6 py-7 lg:block">
                  <div className="relative">
                    <div className="absolute left-[48px] right-[48px] top-[22px] h-px bg-black/10" />
                    <div
                      className="absolute left-[48px] top-[22px] h-px bg-brand-primary transition-[width] duration-300"
                      style={{ width: `calc((100% - 96px) * ${progressPercent / 100})` }}
                    />

                    <div className="grid grid-cols-5 gap-4">
                      {orderFlow.map((step, index) => {
                        const completed = activeStep >= index;
                        const current = activeStep === index;

                        return (
                          <div key={step.key} className="relative">
                            <div className="flex justify-center">
                              <span
                                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                                  current
                                    ? "border-brand-primary bg-white text-brand-dark shadow-[0_0_0_6px_rgba(243,179,61,0.18)]"
                                    : completed
                                      ? "border-brand-primary bg-brand-primary text-brand-dark"
                                      : "border-black/12 bg-white text-black/42"
                                }`}
                              >
                                {completed && !current ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-4.5 w-4.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M7.5 12.5L10.5 15.5L16.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  index + 1
                                )}
                              </span>
                            </div>

                            <div className="mt-5 text-center">
                              <p
                                className={`text-sm font-semibold ${
                                  current || completed ? "text-brand-dark" : "text-black/45"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="mx-auto mt-2 max-w-[150px] text-xs leading-6 text-black/48">
                                {step.copy}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:hidden">
                  {orderFlow.map((step, index) => {
                    const completed = activeStep >= index;
                    const current = activeStep === index;

                    return (
                      <article
                        key={step.key}
                        className={`rounded-[22px] border bg-white px-4 py-4 ${
                          current
                            ? "border-brand-primary shadow-[0_0_0_4px_rgba(243,179,61,0.14)]"
                            : "border-black/8"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <StepMarker completed={completed} current={current} index={index} />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold ${
                                current || completed ? "text-brand-dark" : "text-black/45"
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-black/55">{step.copy}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="rounded-[26px] border border-black/8 bg-white px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                          Current milestone
                        </p>
                        <p className="mt-3 text-xl font-semibold text-brand-dark">{currentStep?.label || statusMeta.label}</p>
                      </div>
                      <span className="inline-flex w-fit items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                        Stage {reachedStepCount} of {orderFlow.length}
                      </span>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62">
                      {currentStep?.copy || "This order will keep updating here as CandleOra moves it through the fulfillment flow."}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[20px] border border-black/8 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/42">
                          Right now
                        </p>
                        <p className="mt-3 text-sm leading-7 text-black/62">
                          The order is currently marked as <span className="font-semibold text-brand-dark">{statusMeta.label}</span>.
                        </p>
                      </div>

                      <div className="rounded-[20px] border border-black/8 bg-white px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/42">
                          Next up
                        </p>
                        <p className="mt-3 text-sm leading-7 text-black/62">
                          {nextStep
                            ? `The next visible update here will be ${nextStep.label.toLowerCase()}.`
                            : "This is the final milestone in the fulfillment flow."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-black/8 bg-white px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                      Tracking reference
                    </p>
                    <p className="mt-3 break-all text-lg font-semibold text-brand-dark">{trackingReference}</p>
                    <div className="mt-5 space-y-4">
                      <DetailRow label="Current status" value={statusMeta.label} />
                      <DetailRow label="Payment" value={paymentStatusLabel} />
                      <DetailRow label="Estimate" value={deliveryRange} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1.18fr)_340px]">
            <div className="border-t border-black/8 px-6 py-8 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                    Items
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-dark">Order ledger</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-black/58">
                    Every product in this purchase is listed with quantity, unit price, and the saved order total.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                  {itemCount} unit{itemCount === 1 ? "" : "s"}
                </span>
              </div>

              {orderItems.length ? (
                <div className="mt-6 overflow-hidden rounded-[28px] border border-black/8 bg-white">
                  <div className="divide-y divide-black/8">
                    {orderItems.map((item) => {
                      const itemImage = getResponsiveImageProps(item.imageUrl, {
                        widths: [160, 240, 320],
                        quality: 68,
                        sizes: "96px",
                      });

                      return (
                        <article
                          key={item.id}
                          className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-[#f5efe4]">
                              {item.imageUrl ? (
                                <img
                                  src={itemImage.src}
                                  srcSet={itemImage.srcSet}
                                  sizes={itemImage.sizes}
                                  alt={item.productName}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(event) => applyImageFallback(event, fallbackProductImage)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#f5efe4] text-sm font-semibold uppercase tracking-[0.14em] text-black/45">
                                  Candle
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-lg font-semibold text-brand-dark">
                                {item.productName}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/55">
                                <span className="rounded-full border border-black/10 px-3 py-1">
                                  Qty {item.quantity}
                                </span>
                                <span>{formatCurrency(item.price)} each</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-xl font-semibold text-brand-dark lg:pl-4">
                            {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                          </span>
                        </article>
                      );
                    })}
                  </div>

                  <div className="border-t border-black/8 bg-white px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="space-y-3 text-sm text-black/62">
                        <DetailRow
                          label="Subtotal"
                          value={formatCurrency(order.subtotalAmount ?? order.totalAmount)}
                        />
                        {order.discountAmount ? (
                          <DetailRow
                            label="Discount"
                            value={`-${formatCurrency(order.discountAmount)}`}
                            valueClassName="text-success"
                          />
                        ) : null}
                        <DetailRow label="Shipping" value="Included" />
                      </div>

                      <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                          Final total
                        </p>
                        <p className="mt-3 text-3xl font-semibold leading-none text-brand-dark">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="mt-3 text-xs leading-6 text-black/45">
                          This saved total stays attached to the order record for invoices, support, and future reference.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-dashed border-black/12 px-5 py-8 text-sm leading-7 text-black/58">
                  Order items will appear here as soon as the record is available.
                </div>
              )}
            </div>

            <aside className="border-t border-black/8 bg-white px-6 py-8 sm:px-8 xl:border-l">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                    Delivering to
                  </p>
                  <p className="mt-3 text-lg font-semibold text-brand-dark">{order.shippingName}</p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-black/62">
                    <p>{addressSummary}</p>
                    {locationSummary ? <p>Pinned location: {locationSummary}</p> : null}
                    <p>Phone: {order.phone}</p>
                    {order.alternatePhoneNumber ? <p>Alternate phone: {order.alternatePhoneNumber}</p> : null}
                    <p>Email: {order.contactEmail}</p>
                    <p>Estimate: {deliveryRange}</p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                    Payment record
                  </p>
                  <div className="mt-4 space-y-3 text-sm leading-7 text-black/62">
                    <DetailRow label="Provider" value={paymentProviderLabel} />
                    <DetailRow label="Status" value={paymentStatusLabel} />
                    <DetailRow label="Method" value={order.paymentMethod || "Saved at checkout"} />
                    {order.couponCode ? <DetailRow label="Coupon" value={order.couponCode} /> : null}
                    {order.gatewayOrderId ? <DetailRow label="Gateway order" value={order.gatewayOrderId} /> : null}
                    {order.gatewayPaymentId ? <DetailRow label="Gateway payment" value={order.gatewayPaymentId} /> : null}
                  </div>
                </div>

                <div
                  className={`rounded-[24px] border px-5 py-5 ${
                    order.status === "CANCELLED"
                      ? "border-danger/18 bg-[#fff7f7]"
                      : "border-black/8 bg-white"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                    Support and changes
                  </p>
                  <p className="mt-3 text-base font-semibold text-brand-dark">
                    {order.status === "CANCELLED" ? "Cancellation saved" : "Need to change something?"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-black/62">{cancellationSummary}</p>
                  {order.status !== "CANCELLED" ? (
                    <p className="mt-2 text-sm leading-7 text-black/62">
                      Return or replacement requests can be raised within 7 days after delivery.
                    </p>
                  ) : null}
                  {showCancelActions ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-danger/20 px-5 py-3 text-sm font-semibold text-danger transition duration-200 hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel order"}
                    </button>
                  ) : null}
                  <Link
                    to="/contact"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-black/12 px-5 py-3 text-sm font-semibold text-brand-dark transition duration-200 hover:bg-black/[0.03]"
                  >
                    Contact support
                  </Link>
                  {cancelError ? <p className="mt-3 text-sm text-danger">{cancelError}</p> : null}
                </div>
              </div>
            </aside>
          </div>
        </m.div>
      </div>
    </section>
  );
}

export default OrderDetail;
