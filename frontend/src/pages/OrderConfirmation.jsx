import { useEffect, useMemo, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
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

function OrderConfirmation() {
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

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getOrder(orderId)
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
  }, [orderId]);

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
  const itemCount = order.items.reduce((count, item) => count + Number(item.quantity ?? 0), 0);
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

  return (
    <section className="container-shell py-8 sm:py-10">
      <m.div
        {...sectionMotion}
        className="overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
      >
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.28fr)_360px]">
          <div className="border-b border-black/8 px-6 py-8 sm:px-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/8 bg-[#fff8ec] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/58">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand-primary" />
              Order confirmed
              <span className="text-black/28">#{order.id}</span>
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="font-display text-[clamp(2.45rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.045em] text-brand-dark">
                Your order is locked in and moving.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-black/62 sm:text-base">
                We have saved your order, delivery details, and payment record in one place so you
                can track progress, download the invoice, or make quick changes without hunting
                through multiple screens.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/55">
                {itemCount} item{itemCount === 1 ? "" : "s"}
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

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[26px] border border-black/8 bg-[#fffdf8] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                  Payment
                </p>
                <p className="mt-3 text-xl font-semibold text-brand-dark">{paymentStatusLabel}</p>
                <p className="mt-1 text-sm text-black/56">{paymentProviderLabel}</p>
              </div>

              <div className="rounded-[26px] border border-black/8 bg-[#fffdf8] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                  Estimated delivery
                </p>
                <p className="mt-3 text-xl font-semibold text-brand-dark">{deliveryRange}</p>
                <p className="mt-1 text-sm text-black/56">{deliverySummary}</p>
              </div>

              <div className="rounded-[26px] border border-black/8 bg-[#fff6dd] px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                  Total
                </p>
                <p className="mt-3 text-[2rem] font-semibold leading-none text-brand-dark">
                  {formatCurrency(order.totalAmount)}
                </p>
                <p className="mt-2 text-sm text-black/56">Saved to your order history</p>
              </div>
            </div>

            <div className="mt-8 max-w-[780px] rounded-[28px] border border-black/8 bg-[#fffdf8] p-3">
              <div className={`grid gap-3 ${order.invoiceNumber ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {order.invoiceNumber ? (
                  <button
                    type="button"
                    className={`${actionButtonBaseClass} border border-[#e8b13d] bg-brand-primary text-brand-dark hover:bg-[#f0ad15]`}
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                  >
                    {isDownloadingInvoice ? "Preparing invoice..." : "Download invoice"}
                  </button>
                ) : null}

                <Link
                  to={`/orders/${order.id}`}
                  className={`${actionButtonBaseClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
                >
                  View full order
                </Link>

                <Link
                  to="/shop"
                  className={`${actionButtonBaseClass} border border-black/12 bg-white text-brand-dark hover:bg-black/[0.03]`}
                >
                  Continue shopping
                </Link>
              </div>
            </div>

            {downloadError ? <p className="mt-4 text-sm text-danger">{downloadError}</p> : null}
            <div className="mt-8 border-t border-black/8 pt-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
                      Confirmed items
                    </p>
                    <p className="mt-1.5 max-w-2xl text-sm leading-7 text-black/58">
                      Your final order ledger, including unit pricing, quantity, and the total saved to
                      your account.
                    </p>
                  </div>
                  <span className="inline-flex w-fit whitespace-nowrap items-center rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
                    Order ledger
                  </span>
                </div>

                <div className="mt-5 overflow-hidden rounded-[30px] border border-black/8 bg-[#fffdf9]">
                <div className="space-y-4 px-4 py-4 sm:px-5">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-[24px] border border-black/6 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[20px] bg-[#f5efe4]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
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

                      <span className="text-xl font-semibold text-brand-dark sm:pl-4">
                        {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-black/8 bg-[#fff8ed] px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    {order.couponCode ? (
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-black/60">
                        Coupon {order.couponCode}
                      </span>
                    ) : null}
                    {order.invoiceNumber ? (
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-black/60">
                        {order.invoiceNumber}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-3 text-sm text-black/62">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotalAmount ?? order.totalAmount)}</span>
                      </div>
                      {order.discountAmount ? (
                        <div className="flex items-center justify-between">
                          <span>Discount</span>
                          <span>-{formatCurrency(order.discountAmount)}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <span>Included</span>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
                        Final total
                      </p>
                      <p className="mt-3 text-3xl font-semibold leading-none text-brand-dark">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="mt-3 text-xs leading-6 text-black/45">
                        This receipt is saved in your account and can be reopened anytime from your
                        orders page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="bg-[#fffaf0] px-6 py-8 sm:px-8 lg:px-8 lg:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/42">
              Order snapshot
            </p>

            <div className="mt-4 rounded-[28px] border border-black/8 bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-black/54">Order number</p>
                  <p className="mt-2 font-display text-3xl leading-none text-brand-dark">
                    #{order.id}
                  </p>
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/18 text-brand-dark">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7.5 12.5L10.5 15.5L16.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-sm text-black/62">
                <div className="flex items-center justify-between">
                  <span>Placed</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment</span>
                  <span>{paymentStatusLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>
                <div className="flex items-center justify-between border-t border-black/8 pt-4 text-base font-semibold text-brand-dark">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                  Delivering to
                </p>
                <p className="mt-3 text-lg font-semibold text-brand-dark">{order.shippingName}</p>
                <div className="mt-3 space-y-2 text-sm leading-7 text-black/62">
                  <p>{addressSummary}</p>
                  <p>{order.contactEmail}</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                  Timeline
                </p>
                <div className="mt-4 space-y-4">
                  {orderFlow.map((status, index) => {
                    const complete = activeStep >= index;
                    const current = activeStep === index;

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-3 w-3 rounded-full ${
                            complete ? "bg-brand-primary" : "bg-black/12"
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              current || complete ? "text-brand-dark" : "text-black/42"
                            }`}
                          >
                            {titleCase(status)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order.status !== "CANCELLED" ? (
                <div className="rounded-[24px] border border-danger/18 bg-[#fff7f7] px-5 py-5">
                  <p className="text-sm font-semibold text-brand-dark">Cancellation &amp; returns</p>
                  {liveCanCancel ? (
                    <p className="mt-2 text-sm leading-7 text-black/62">
                      You can cancel this order online until {formatDateTime(order.cancelDeadline)}.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-7 text-black/62">
                      The 24-hour online cancellation window has ended for this order.
                    </p>
                  )}
                  {liveCanCancel ? (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-danger/80">
                      {cancelTimeRemaining}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm leading-7 text-black/62">
                    Return or replacement requests can be raised within 7 days after delivery.
                  </p>
                  {liveCanCancel ? (
                    <button
                      type="button"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-danger/20 px-5 py-3 text-sm font-semibold text-danger transition duration-200 hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel order"}
                    </button>
                  ) : null}
                  {cancelError ? <p className="mt-3 text-sm text-danger">{cancelError}</p> : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </m.div>
    </section>
  );
}

export default OrderConfirmation;
