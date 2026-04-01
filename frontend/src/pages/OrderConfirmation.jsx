import { useEffect, useMemo, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/api";
import { readLastPlacedOrderIdForUser } from "../utils/checkoutSession";
import {
  formatApiError,
  formatCurrency,
  formatDateRange,
  formatDateTime,
  formatTimeRemaining,
  titleCase,
} from "../utils/format";

const heroButtonClass =
  "inline-flex min-h-[52px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

const actionButtonBaseClass =
  "inline-flex min-h-[54px] w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

const orderFlow = ["PENDING_PAYMENT", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const orderStepLabels = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

function formatPaymentProviderLabel(provider) {
  const normalized = String(provider ?? "").toUpperCase();

  if (normalized === "COD") {
    return "Cash on delivery";
  }

  if (normalized === "UPI") {
    return "UPI";
  }

  if (normalized === "NETBANKING") {
    return "Net banking";
  }

  if (normalized === "CARD") {
    return "Card";
  }

  if (normalized === "WALLET") {
    return "Wallet";
  }

  if (normalized === "PHONEPE") {
    return "PhonePe";
  }

  if (normalized === "RAZORPAY") {
    return "Razorpay";
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

function formatOrderStepLabel(status) {
  const normalized = String(status ?? "").toUpperCase();
  return orderStepLabels[normalized] || titleCase(normalized);
}

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orderId } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const resolvedOrderId = useMemo(() => {
    if (orderId) {
      return orderId;
    }

    const stateOrderId = location.state?.orderId;
    if (stateOrderId) {
      return String(stateOrderId);
    }

    const storedOrderId = readLastPlacedOrderIdForUser(user);
    return storedOrderId ? String(storedOrderId) : "";
  }, [location.state, orderId, user]);

  useEffect(() => {
    if (!orderId && resolvedOrderId) {
      navigate(`/order-confirmation/${resolvedOrderId}`, {
        replace: true,
        state: { orderId: resolvedOrderId },
      });
    }
  }, [navigate, orderId, resolvedOrderId]);

  useEffect(() => {
    if (!resolvedOrderId) {
      setIsLoading(false);
      setError("We could not find a recent order to display.");
      return;
    }

    let isMounted = true;

    orderApi
      .getOrder(resolvedOrderId)
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
  }, [resolvedOrderId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

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
    if (
      !order?.canCancel ||
      !order?.cancelDeadline ||
      new Date(order.cancelDeadline).getTime() <= currentTime ||
      isCancelling
    ) {
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

  const activeStep = useMemo(() => {
    if (!order?.status || order.status === "CANCELLED") {
      return -1;
    }

    return orderFlow.indexOf(order.status);
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

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading confirmation" message="Fetching the latest order details." />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Order confirmation unavailable"
          message={error || "The order could not be found."}
        />
      </section>
    );
  }

  const sectionMotion = prefersReducedMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      };

  const paymentProviderLabel = formatPaymentProviderLabel(order.paymentProvider);
  const paymentStatusLabel = formatPaymentStatusLabel(order.paymentStatus, order.paymentProvider);
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const itemCount = orderItems.reduce((count, item) => count + Number(item.quantity ?? 0), 0);
  const deliveryRange = formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd);
  const deliverySummary = [order.shippingName, order.city, order.country]
    .filter(Boolean)
    .join(", ");
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
  const currentStepLabel =
    order.status === "CANCELLED"
      ? "Cancelled"
      : formatOrderStepLabel(activeStep >= 0 ? orderFlow[activeStep] : "CONFIRMED");
  const nextStepLabel =
    activeStep >= 0 && activeStep < orderFlow.length - 1
      ? formatOrderStepLabel(orderFlow[activeStep + 1])
      : "Delivered";

  return (
    <section className="container-shell py-8 sm:py-10">
      <m.div {...sectionMotion} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[30px] border border-black/10 bg-[#fffdf8] px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/8 bg-[#fff8ec] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/58">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary" />
              Order confirmed
              <span className="text-black/28">#{order.id}</span>
            </div>

            <div className="mt-6 max-w-3xl space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                  Confirmation
                </p>
                <h1 className="mt-3 page-title">Your order is confirmed.</h1>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-black/62 sm:text-base">
                We&apos;ve saved your payment, delivery, and order record in one place. Use this
                page for the immediate next step, then open the full order page whenever you need
                the detailed ledger or support actions.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                {paymentStatusLabel}
              </span>
              <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                Estimated {deliveryRange}
              </span>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Total paid
                </p>
                <p className="mt-3 text-[2rem] font-semibold leading-none text-brand-dark">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="mt-2 text-sm text-black/56">{paymentProviderLabel}</p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Current stage
                </p>
                <p className="mt-3 text-xl font-semibold text-brand-dark">{currentStepLabel}</p>
                <p className="mt-2 text-sm text-black/56">
                  Next visible update: {nextStepLabel}
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                  Delivering to
                </p>
                <p className="mt-3 text-lg font-semibold text-brand-dark">{order.shippingName}</p>
                <p className="mt-2 text-sm text-black/56">{deliverySummary}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {order.invoiceNumber ? (
                <button
                  type="button"
                  className={`${heroButtonClass} border border-[#e8b13d] bg-brand-primary text-brand-dark hover:bg-[#f0ad15]`}
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                >
                  {isDownloadingInvoice ? "Preparing invoice..." : "Download invoice"}
                </button>
              ) : null}
              <Link
                to={`/orders/${order.id}`}
                className={`${heroButtonClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
              >
                Track order
              </Link>
              <Link
                to="/shop"
                className={`${heroButtonClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
              >
                Continue shopping
              </Link>
            </div>

            {downloadError ? <p className="mt-4 text-sm text-danger">{downloadError}</p> : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                Order snapshot
              </p>
              <p className="mt-3 font-display text-3xl leading-none text-brand-dark">#{order.id}</p>
              <div className="mt-5 space-y-4 text-sm text-black/62">
                <div className="flex items-center justify-between gap-4">
                  <span>Placed</span>
                  <span className="text-right font-medium text-brand-dark">{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Payment</span>
                  <span className="text-right font-medium text-brand-dark">{paymentStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Provider</span>
                  <span className="text-right font-medium text-brand-dark">{paymentProviderLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-black/8 pt-4">
                  <span>Total</span>
                  <span className="text-right text-base font-semibold text-brand-dark">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                Delivering to
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">{order.shippingName}</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-black/62">
                <p>{addressSummary}</p>
                {order.phone ? <p>{order.phone}</p> : null}
                {order.contactEmail ? <p>{order.contactEmail}</p> : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-black/10 bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                What happens now
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">{currentStepLabel}</p>
              <p className="mt-2 text-sm leading-7 text-black/62">
                {order.status === "CANCELLED"
                  ? "This order has already been cancelled and saved in your order history."
                  : `We’ll keep updating this order as it moves from ${currentStepLabel.toLowerCase()} to ${nextStepLabel.toLowerCase()}.`}
              </p>
              {liveCanCancel ? (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-danger/80">
                    {cancelTimeRemaining}
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-danger/20 px-5 py-3 text-sm font-semibold text-danger transition duration-200 hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel order"}
                  </button>
                </>
              ) : null}
              {cancelError ? <p className="mt-3 text-sm text-danger">{cancelError}</p> : null}
            </div>
          </aside>
        </div>

        <div className="rounded-[30px] border border-black/10 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                Progress
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-dark">Delivery and fulfillment timeline</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Estimated {deliveryRange}
            </span>
          </div>

          <div className="mt-6 hidden grid-cols-5 gap-4 lg:grid">
            {orderFlow.map((status, index) => {
              const completed = activeStep >= index;
              const current = activeStep === index;

              return (
                <div key={status} className="relative text-center">
                  {index !== orderFlow.length - 1 ? (
                    <span className="absolute left-1/2 top-5 h-px w-full bg-black/10" />
                  ) : null}
                  <div className="relative flex justify-center">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                        current
                          ? "border-brand-primary bg-white text-brand-dark shadow-[0_0_0_4px_rgba(243,179,61,0.18)]"
                          : completed
                            ? "border-brand-primary bg-brand-primary text-brand-dark"
                            : "border-black/12 bg-white text-black/42"
                      }`}
                    >
                      {completed && !current ? (
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7.5 12.5L10.5 15.5L16.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                  </div>
                  <p className={`mt-4 text-sm font-semibold ${current || completed ? "text-brand-dark" : "text-black/45"}`}>
                    {formatOrderStepLabel(status)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 lg:hidden">
            {orderFlow.map((status, index) => {
              const completed = activeStep >= index;
              const current = activeStep === index;

              return (
                <div
                  key={status}
                  className={`rounded-[20px] border px-4 py-4 ${current ? "border-brand-primary bg-[#fffdf8]" : "border-black/8 bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        current ? "bg-brand-primary text-brand-dark" : completed ? "bg-brand-primary/18 text-brand-dark" : "bg-black/8 text-black/42"
                      }`}
                    >
                      {completed && !current ? "✓" : index + 1}
                    </span>
                    <p className={`text-sm font-semibold ${current || completed ? "text-brand-dark" : "text-black/45"}`}>
                      {formatOrderStepLabel(status)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[30px] border border-black/10 bg-white px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                Items
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-dark">Items in this order</p>
            </div>
            <Link
              to={`/orders/${order.id}`}
              className="inline-flex w-fit items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55 transition hover:bg-black/[0.03]"
            >
              View full order
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {orderItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-[24px] border border-black/8 bg-[#fffdf9] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f5efe4]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-brand-dark">{item.productName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/55">
                      <span className="rounded-full border border-black/10 px-3 py-1">Qty {item.quantity}</span>
                      <span>{formatCurrency(item.price)} each</span>
                    </div>
                  </div>
                </div>
                <span className="text-lg font-semibold text-brand-dark">
                  {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                </span>
              </article>
            ))}
          </div>
        </div>
      </m.div>
    </section>
  );
}

export default OrderConfirmation;
