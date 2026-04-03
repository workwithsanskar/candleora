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
} from "../utils/format";

function SuccessCheckMark() {
  return (
    <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#148a17] text-white shadow-[0_18px_40px_rgba(20,138,23,0.24)]">
      <svg
        viewBox="0 0 24 24"
        className="h-10 w-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path
          d="M6.5 12.5L10.2 16.2L17.8 8.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SummaryPill({ children }) {
  return (
    <span className="rounded-full border border-black/10 bg-[#fbf7f0] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
      {children}
    </span>
  );
}

function BackgroundPanel({ label, title, detail }) {
  return (
    <div className="rounded-[28px] border border-black/8 bg-white px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
        {label}
      </p>
      <p className="mt-3 text-[1.25rem] font-semibold leading-7 text-brand-dark">{title}</p>
      <p className="mt-2 text-sm leading-7 text-black/58">{detail}</p>
    </div>
  );
}

function BackgroundOrderItem({ item }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-[#fffdf9] px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-brand-dark">{item.productName}</p>
        <p className="mt-1 text-sm text-black/54">Qty {item.quantity}</p>
      </div>
      <p className="shrink-0 text-base font-semibold text-brand-dark">
        {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
      </p>
    </div>
  );
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

  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce(
    (count, item) => count + Number(item.quantity ?? 0),
    0,
  );
  const deliveryRange = formatDateRange(
    order.estimatedDeliveryStart,
    order.estimatedDeliveryEnd,
  );
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

  const pageMotion = prefersReducedMotion
    ? {
        initial: false,
        animate: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      };

  const modalMotion = prefersReducedMotion
    ? {
        initial: false,
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1], delay: 0.08 },
      };

  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden bg-[#fffdf8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,245,227,0.92),_rgba(255,253,248,0.78)_46%,_rgba(244,238,228,0.5)_100%)]" />

      <m.div {...pageMotion} className="container-shell relative py-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none space-y-6 opacity-[0.32] blur-[2px]"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <BackgroundPanel
                label="Order placed"
                title={`Order #${order.id}`}
                detail={`Placed on ${formatDateTime(order.createdAt)}`}
              />

              <div className="rounded-[30px] border border-black/8 bg-white px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">
                      Items
                    </p>
                    <p className="mt-3 text-[1.3rem] font-semibold text-brand-dark">
                      Items in this order
                    </p>
                  </div>
                  <p className="text-sm font-medium text-black/48">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {items.map((item) => (
                    <BackgroundOrderItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <BackgroundPanel
                label="Total paid"
                title={formatCurrency(order.totalAmount)}
                detail={order.paymentProvider || "Payment received"}
              />
              <BackgroundPanel
                label="Delivering to"
                title={order.shippingName}
                detail={addressSummary || "Saved shipping address"}
              />
              <BackgroundPanel
                label="Estimated delivery"
                title={deliveryRange}
                detail="We'll keep updating the order as it moves through fulfillment."
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 z-[1] bg-[rgba(22,14,8,0.18)] backdrop-blur-[5px]" />

        <div className="absolute inset-0 z-[2] flex items-center justify-center px-4 py-8 sm:px-6">
          <m.div
            {...modalMotion}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-confirmation-title"
            className="w-full max-w-[860px] rounded-[34px] border border-black/8 bg-white px-6 py-10 text-center shadow-[0_40px_140px_rgba(15,23,42,0.18)] sm:px-10 sm:py-12"
          >
            <SuccessCheckMark />

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a27b3f]">
              CandleOra
            </p>

            <h1
              id="order-confirmation-title"
              className="mt-4 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-none text-brand-dark"
            >
              Thank you!
            </h1>

            <p className="mx-auto mt-4 max-w-[34ch] text-sm leading-7 text-black/56 sm:text-base">
              Your order has been confirmed and it is on the way. Check your email for the details.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <SummaryPill>Order #{order.id}</SummaryPill>
              <SummaryPill>{itemCount} item{itemCount === 1 ? "" : "s"}</SummaryPill>
              <SummaryPill>{deliveryRange}</SummaryPill>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#1f1b18] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#0f0d0b]"
              >
                Go to Homepage
              </Link>
              <Link
                to={`/orders/${order.id}`}
                className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-black/14 bg-white px-8 py-3 text-sm font-semibold text-brand-dark transition hover:bg-black/[0.03]"
              >
                Check Order Details
              </Link>
            </div>
          </m.div>
        </div>
      </m.div>
    </section>
  );
}

export default OrderConfirmation;
